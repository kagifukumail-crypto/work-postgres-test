const functions = require("firebase-functions");
const { Pool } = require("pg");
const cors = require("cors")({ origin: true });

// ① データベースの接続設定（先ほど成功した設定をそのまま入力してください）
const pool = new Pool({
    host: "192.168.1.15",      // 社内PostgreSQLのIPアドレス
    port: 5432,               // ポート番号（デフォルトは5432）
    database: "towaDB", // データベース名
    user: "towa_r",    // ユーザー名
    password: "CapyTqn8vC11" // パスワード
  });

  exports.getData = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
      try {
        const view = String(req.query.view || "summary").toLowerCase();
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        let formattedStartDate = null;
        let formattedEndDate = null;

        if (view === "sqlmeta") {
          const tableName = req.query.tableName;
          if (!tableName) {
            const tablesResult = await pool.query(`
              SELECT table_name
              FROM information_schema.tables
              WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE'
              ORDER BY table_name ASC;
            `);
            return res.status(200).json({ tables: tablesResult.rows.map((row) => row.table_name) });
          }

          const colsResult = await pool.query(
            `
              SELECT column_name
              FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = $1
              ORDER BY ordinal_position ASC;
            `,
            [tableName]
          );
          return res.status(200).json({ columns: colsResult.rows.map((row) => row.column_name) });
        }

        if (view === "sqlpreview") {
          const tableName = String(req.query.tableName || "");
          const columnNamesParam = String(req.query.columnNames || req.query.columnName || "");
          const columnNames = columnNamesParam
            .split(",")
            .map((name) => name.trim())
            .filter((name) => name !== "");
          if (!tableName || columnNames.length === 0) {
            return res.status(400).send("テーブル名とカラム名を指定してください");
          }

          const identPattern = /^[A-Za-z0-9_]+$/;
          if (!identPattern.test(tableName) || columnNames.some((name) => !identPattern.test(name))) {
            return res.status(400).send("テーブル名またはカラム名が不正です");
          }

          const tableCheck = await pool.query(
            `
              SELECT 1
              FROM information_schema.tables
              WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE'
                AND table_name = $1
              LIMIT 1;
            `,
            [tableName]
          );
          if (tableCheck.rows.length === 0) {
            return res.status(400).send("指定されたテーブルが存在しません");
          }

          const columnCheck = await pool.query(
            `
              SELECT column_name
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = $1
                AND column_name = ANY($2::text[]);
            `,
            [tableName, columnNames]
          );
          const existingColumns = new Set(columnCheck.rows.map((row) => row.column_name));
          const missingColumns = columnNames.filter((name) => !existingColumns.has(name));
          if (missingColumns.length > 0) {
            return res.status(400).send("指定されたカラムが存在しません");
          }

          const selectColumns = columnNames.map((name) => `"${name}"`).join(", ");

          const filterStart = req.query.startDate;
          const filterEnd = req.query.endDate;
          const dateColumn = String(req.query.dateColumn || "").trim();

          let queryText = `
            SELECT ${selectColumns}
            FROM "${tableName}"
          `;
          const queryValues = [];

          if (filterStart && filterEnd) {
            if (!dateColumn || !identPattern.test(dateColumn)) {
              return res.status(400).send("期間指定には dateColumn を指定してください");
            }
            const dcCheck = await pool.query(
              `
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = $1
                  AND column_name = $2
                LIMIT 1;
              `,
              [tableName, dateColumn]
            );
            if (dcCheck.rows.length === 0) {
              return res.status(400).send("期間で絞るカラムがテーブルに存在しません");
            }
            const formattedStart = String(filterStart).replace(/-/g, "/");
            const formattedEnd = String(filterEnd).replace(/-/g, "/");
            queryText += ` WHERE "${dateColumn}" >= $1 AND "${dateColumn}" <= $2`;
            queryValues.push(formattedStart, formattedEnd);
          }

          queryText += `
            LIMIT 50;
          `;
          const result = await pool.query(queryText, queryValues);
          return res.status(200).json({ columns: columnNames, rows: result.rows });
        }

        if (view === "tanameta") {
          const listResult = await pool.query(`
            SELECT DISTINCT a.nendo
            FROM tana_d AS a
            WHERE a.nendo IS NOT NULL
            ORDER BY a.nendo DESC;
          `);
          const nendoList = listResult.rows
            .map((row) => String(row.nendo).trim())
            .filter((n) => n !== "");
          return res.status(200).json({ nendoList });
        }

        if (view === "tanasummary") {
          const nendo1 = req.query.nendo1;
          const nendo2 = req.query.nendo2;
          if (nendo1 == null || nendo2 == null || String(nendo1).trim() === "" || String(nendo2).trim() === "") {
            return res.status(400).send("比較1・比較2の年度を指定してください");
          }
          const v1 = String(nendo1).trim();
          const v2 = String(nendo2).trim();

          const listResult = await pool.query(`
            SELECT DISTINCT a.nendo
            FROM tana_d AS a
            WHERE a.nendo IS NOT NULL;
          `);
          const allowed = new Set(listResult.rows.map((row) => String(row.nendo).trim()));
          if (!allowed.has(v1) || !allowed.has(v2)) {
            return res.status(400).send("指定された年度が棚卸データに存在しません");
          }

          const sumSql = `
            SELECT
              (
                SELECT COALESCE(SUM(a.zaikin::numeric), 0)
                FROM tana_d AS a
                WHERE TRIM(BOTH FROM a.nendo::text) = TRIM(BOTH FROM $1::text)
              ) AS past_zaikin,
              (
                SELECT COALESCE(SUM(a.zaikin::numeric), 0)
                FROM tana_d AS a
                WHERE TRIM(BOTH FROM a.nendo::text) = TRIM(BOTH FROM $2::text)
              ) AS recent_zaikin;
          `;
          const sumResult = await pool.query(sumSql, [v1, v2]);
          const row = sumResult.rows[0] || {};
          return res.status(200).json({
            pastZaikin: row.past_zaikin,
            recentZaikin: row.recent_zaikin,
            nendo1: v1,
            nendo2: v2
          });
        }

        if (view === "zaikommeta") {
          const listResult = await pool.query(`
            SELECT DISTINCT a.nendo
            FROM zaikom_d AS a
            WHERE a.nendo IS NOT NULL
            ORDER BY a.nendo DESC;
          `);
          const nendoList = listResult.rows
            .map((row) => String(row.nendo).trim())
            .filter((n) => n !== "");
          return res.status(200).json({ nendoList });
        }

        if (view === "zaikomsummary") {
          const nendo = req.query.nendo;
          if (nendo == null || String(nendo).trim() === "") {
            return res.status(400).send("集計年度を指定してください");
          }
          const v = String(nendo).trim();

          const listResult = await pool.query(`
            SELECT DISTINCT a.nendo
            FROM zaikom_d AS a
            WHERE a.nendo IS NOT NULL;
          `);
          const allowed = new Set(listResult.rows.map((row) => String(row.nendo).trim()));
          if (!allowed.has(v)) {
            return res.status(400).send("指定された年度が在庫データに存在しません");
          }

          const sumResult = await pool.query(
            `
              SELECT COALESCE(SUM(a.zaikin::numeric), 0) AS monthly_zaikin
              FROM zaikom_d AS a
              WHERE TRIM(BOTH FROM a.nendo::text) = TRIM(BOTH FROM $1::text);
            `,
            [v]
          );
          const row = sumResult.rows[0] || {};
          return res.status(200).json({
            monthlyZaikin: row.monthly_zaikin,
            nendo: v
          });
        }

        if (!startDate || !endDate) {
          return res.status(400).send("日付が指定されていません");
        }

        formattedStartDate = startDate.replace(/-/g, '/');
        formattedEndDate = endDate.replace(/-/g, '/');

        if (view === "purchasesummary") {
          const queryText = `
            SELECT
              a.siryaku AS siryaku,
              SUM(
                CASE
                  WHEN TRIM(BOTH FROM COALESCE(a.jisyakbn::text, '')) = '0'
                   AND TRIM(BOTH FROM COALESCE(a.zaishitu::text, '')) <> '97'
                  THEN COALESCE(a.skingu, 0)::numeric
                  ELSE 0
                END
              ) AS siire_kin,
              SUM(
                CASE
                  WHEN TRIM(BOTH FROM COALESCE(a.zaishitu::text, '')) = '97'
                  THEN COALESCE(a.skingu, 0)::numeric
                  ELSE 0
                END
              ) AS chukai_zai,
              SUM(
                CASE
                  WHEN TRIM(BOTH FROM COALESCE(a.jisyakbn::text, '')) = '1'
                  THEN COALESCE(a.skingu, 0)::numeric
                  ELSE 0
                END
              ) AS gaityu_kin,
              SUM(COALESCE(a.skingu, 0)::numeric) AS total_kin
            FROM siire_d AS a
            WHERE a.sirymd >= $1 AND a.sirymd <= $2
            GROUP BY a.siryaku
            ORDER BY a.siryaku ASC;
          `;
          const values = [formattedStartDate, formattedEndDate];
          const result = await pool.query(queryText, values);
          return res.status(200).json(result.rows);
        }

        if (view === "detail") {
          const tknm = req.query.tknm;
          if (!tknm || String(tknm).trim() === "") {
            return res.status(400).send("売上先会社名が指定されていません");
          }

          const queryText = `
            SELECT
              nohinymd,
              hnnm,
              su,
              jyu_tan,
              jyu_kin,
              tyoha
            FROM uri_d
            WHERE nohinymd >= $1 AND nohinymd <= $2 AND tknm = $3
            ORDER BY nohinymd ASC;
          `;
          const values = [formattedStartDate, formattedEndDate, tknm];
          const result = await pool.query(queryText, values);
          return res.status(200).json(result.rows);
        }

        // summary（デフォルト）：会社別集計
        const queryText = `
          SELECT
            tknm,
            SUM(CASE WHEN hncd ~ '^[0-9]+$' AND hncd::integer BETWEEN 100 AND 199 THEN COALESCE(nohin_kin, 0)::numeric ELSE 0 END) AS lz_kin,
            SUM(CASE WHEN hncd ~ '^[0-9]+$' AND hncd::integer BETWEEN 200 AND 299 THEN COALESCE(nohin_kin, 0)::numeric ELSE 0 END) AS pz_kin,
            SUM(CASE WHEN hncd ~ '^[0-9]+$' AND hncd::integer BETWEEN 400 AND 499 THEN COALESCE(nohin_kin, 0)::numeric ELSE 0 END) AS gaityu_kin,
            SUM(CASE WHEN hncd ~ '^[0-9]+$' AND hncd::integer BETWEEN 300 AND 398 THEN COALESCE(nohin_kin, 0)::numeric ELSE 0 END) AS tyukai_kin,
            SUM(CASE WHEN hncd ~ '^[0-9]+$' AND hncd::integer = 399 THEN COALESCE(nohin_kin, 0)::numeric ELSE 0 END) AS zaiko_kin,
            SUM(CASE WHEN hncd ~ '^[0-9]+$' AND hncd::integer BETWEEN 500 AND 599 THEN COALESCE(nohin_kin, 0)::numeric ELSE 0 END) AS hoka_kin,
            SUM(COALESCE(nohin_kin, 0)::numeric) AS total_kin,
            SUM(CASE WHEN tyoha = '0' THEN jyu_kin::numeric ELSE 0 END) AS total_kin_tyoha0
          FROM uri_d
          WHERE nohinymd >= $1 AND nohinymd <= $2
          GROUP BY tknm
          ORDER BY tknm ASC;
        `;
        const values = [formattedStartDate, formattedEndDate];
        const result = await pool.query(queryText, values);

        res.status(200).json(result.rows);

      } catch (error) {
        console.error("データベースエラー:", error);
        res.status(500).send("データの取得に失敗しました");
      }
    });
  });
