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
          const queryText = `
            SELECT ${selectColumns}
            FROM "${tableName}"
            LIMIT 50;
          `;
          const result = await pool.query(queryText);
          return res.status(200).json({ columns: columnNames, rows: result.rows });
        }

        if (!startDate || !endDate) {
          return res.status(400).send("日付が指定されていません");
        }

        formattedStartDate = startDate.replace(/-/g, '/');
        formattedEndDate = endDate.replace(/-/g, '/');

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
