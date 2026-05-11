-- データベース定義ファイル (DDL)
-- 対象テーブル: jyu_new_d (受注データ), uri_d (売上データ), siire_d (仕入データ), hatty_d (発注データ)
-- 生成日: 2026/05/08

-- ==========================================
-- テーブル名: jyu_new_d (受注データ)
-- ==========================================
CREATE TABLE jyu_new_d (
    jyuno VARCHAR(10), -- 受注番号
    jyugyo VARCHAR(5), -- 行番号
    jyuymd VARCHAR(12), -- 受注日
    tkcd VARCHAR(10), -- 得意先コード
    tknm VARCHAR(200), -- 得意先名
    tktan VARCHAR(40), -- 得意先担当
    nocd VARCHAR(10), -- 納品先コード
    nohinnm VARCHAR(200), -- 納品先名
    yubin VARCHAR(10), -- 郵便番号
    ju1 VARCHAR(100), -- 住所1
    ju2 VARCHAR(100), -- 住所2
    tel VARCHAR(20), -- 電話番号
    ukenin VARCHAR(50), -- 受取人
    tanto VARCHAR(20), -- 当社担当者
    torikbn VARCHAR(2), -- 取引区分
    hncd VARCHAR(20), -- 商品コード
    hnnm VARCHAR(100), -- 商品名
    hnkbn VARCHAR(2), -- 商品区分
    itaatu DOUBLE PRECISION, -- 板厚
    sunpo1 DOUBLE PRECISION, -- 寸法1
    sunpo2 DOUBLE PRECISION, -- 寸法2
    hnsun TEXT, -- 商品寸法明細
    hnhojyo TEXT, -- 商品補足
    keijyo VARCHAR(3), -- 形状コード
    keijyonm VARCHAR(100), -- 形状名
    si_tan DOUBLE PRECISION, -- 仕入単価
    su DOUBLE PRECISION, -- 数量
    tani VARCHAR(10), -- 単位
    shukasu INTEGER, -- 出荷数
    jyu_tan DOUBLE PRECISION, -- 受注単価
    jyu_kin DOUBLE PRECISION, -- 受注金額
    nebikiritu DOUBLE PRECISION, -- 値引き率 (05%値引き対応)
    nohintan DOUBLE PRECISION, -- 納品書単価 (05%値引き対応)
    nohin_kin DOUBLE PRECISION, -- 納品書金額 (05%値引き対応)
    genka DOUBLE PRECISION, -- 原価合計
    arari DOUBLE PRECISION, -- 粗利
    kotai DOUBLE PRECISION, -- 個別体積
    totai DOUBLE PRECISION, -- 体積合計
    kojyu DOUBLE PRECISION, -- 個別重量
    tojyu DOUBLE PRECISION, -- 重量合計
    nouki VARCHAR(40), -- 納期
    sjikou1 TEXT, -- 指示事項1
    sjikou2cd VARCHAR(3), -- 指示事項2コード
    sjikou2 TEXT, -- 指示事項2
    tekiyocd VARCHAR(3), -- 摘要コード
    tekiyo1 TEXT, -- 摘要1
    tekiyo2 TEXT, -- 摘要2
    hatno VARCHAR(10), -- 発注No
    hatgyo VARCHAR(5), -- 発注行
    bikocd VARCHAR(3), -- 備考コード
    biko TEXT, -- 備考
    tyuui TEXT, -- 注意事項
    haisocd VARCHAR(5), -- 配送コード (納品先マスタより)
    haisojyun VARCHAR(5), -- 配送順
    tyakubi VARCHAR(12), -- 着日 (yyyy/mmdd/)
    haisijicd VARCHAR(5), -- 配送指示
    haisijinm VARCHAR(100), -- 配送指示名
    msflg VARCHAR(2), -- ミルシート (10:不要、1:必要)
    tyoha VARCHAR(2), -- 帳端区分
    ukepkbn VARCHAR(1), -- 請負印字区分
    faxno VARCHAR(20), -- FAXNO
    ukepymd VARCHAR(20), -- 請負印字日時
    sijipkbn VARCHAR(1), -- 指示印字区分
    sijipymd VARCHAR(20), -- 指示印字日時
    labelpkbn VARCHAR(1), -- ラベル印字区分
    labelpymd VARCHAR(20), -- ラベル印字日時
    annaipkbn VARCHAR(1), -- 案内印字区分
    annaipymd VARCHAR(20), -- 案内印字日時
    seizokbn VARCHAR(1), -- 製造区分
    sagyono VARCHAR(10), -- 製造No
    nohinkbn VARCHAR(1), -- 納品区分
    nohinno VARCHAR(10), -- 納品No
    entymd VARCHAR(20), -- 入力日付
    entope VARCHAR(20), -- 入力者
    upymd VARCHAR(20), -- 修正日付
    upope VARCHAR(20), -- 修正者
    seizoymd VARCHAR(20), -- 製造日
    nohinymd VARCHAR(20), -- 納品日
    mskbn VARCHAR(1), -- ミルシート印字区分
    msymd VARCHAR(20), -- ミルシート印字日時
    kozaijyu DOUBLE PRECISION, -- 個別材料重量
    tozaijyu DOUBLE PRECISION, -- 材料重量合計
    mitsukbn VARCHAR(1), -- 見積区分
    faxsaki VARCHAR(2), -- FAX送信先 (10:得意、1:納品、3:他)
    tyucd VARCHAR(10), -- 仲介先コード
    haimeipkbn VARCHAR(1), -- 配送明細印字区分
    haimeipymd VARCHAR(20), -- 配送明細印字日時
    pias DOUBLE PRECISION, -- ピアス
    sikaymd VARCHAR(20), -- 仕掛基準日 (yyyy/mmdd/)
    sikakari VARCHAR(2), -- 仕掛指定 (10:通常、1:仕掛)
    sijidenkbn VARCHAR(2), -- 指示票未提出 (10:未、1:済)
    syoumei VARCHAR(2), -- 切断証明書 (10:不要、1:必要)
    seizomedoymd VARCHAR(20), -- 製造目安日 (yyyy/mmdd/)
    torimemo TEXT, -- 取引メモ
    mitsuno VARCHAR(10), -- 見積No
    PRIMARY KEY (jyuno, jyugyo)
);

-- ==========================================
-- テーブル名: uri_d (売上データ)
-- ==========================================
CREATE TABLE uri_d (
    nohinno VARCHAR(10), -- 納品Ｎｏ
    nohingyo VARCHAR(4), -- 納品行番号
    jyuno VARCHAR(10) NOT NULL, -- 受注番号
    jyugyo VARCHAR(4) NOT NULL, -- 行番号
    nohinymd VARCHAR(12), -- 納品日 (yyyy/mm/dd)
    tkcd VARCHAR(10), -- 得意先コード
    tknm VARCHAR(200), -- 得意先名
    tktan VARCHAR(40), -- 得意先担当
    nocd VARCHAR(10), -- 納品先コード
    nohinnm VARCHAR(200), -- 納品先名
    tanto VARCHAR(20), -- 当社担当者
    torikbn VARCHAR(2), -- 取引区分
    hncd VARCHAR(20), -- 商品コード
    hnnm VARCHAR(100), -- 商品名
    hnkbn VARCHAR(2), -- 商品区分
    hnsun TEXT, -- 商品寸法明細
    si_tan DOUBLE PRECISION, -- 仕入単価
    su DOUBLE PRECISION, -- 数量
    tani VARCHAR(10), -- 単位
    jyu_tan DOUBLE PRECISION, -- 受注単価
    jyu_kin DOUBLE PRECISION, -- 受注金額
    nouki VARCHAR(40), -- 納期 (??年??月??日 又は文字)
    nebiki_ritu DOUBLE PRECISION, -- 値引き率 (５％値引き対応)
    nohin_tan DOUBLE PRECISION, -- 納品書単価 (５％値引き対応)
    nohin_kin DOUBLE PRECISION, -- 納品書金額 (５％値引き対応)
    gokei DOUBLE PRECISION, -- 総売上額（実DBに準拠。月次レポート集計に使用）
    genka DOUBLE PRECISION, -- 原価合計
    arari DOUBLE PRECISION, -- 粗利
    tekiyocd VARCHAR(3), -- 摘要ｺｰﾄﾞ
    tekiyo1 TEXT, -- 摘要1
    tekiyo2 TEXT, -- 摘要2
    bikocd VARCHAR(3), -- 備考ｺｰﾄﾞ
    biko TEXT, -- 備考
    PRIMARY KEY (jyuno, jyugyo)
);

-- ==========================================
-- テーブル名: siire_d (仕入データ)
-- ==========================================
CREATE TABLE siire_d (
    sirno VARCHAR(10) NOT NULL, -- 仕入伝票No
    sirgyo VARCHAR(4) NOT NULL, -- 仕入行No
    hatno VARCHAR(10), -- 発注No
    hatgyo VARCHAR(5), -- 行No
    sirymd VARCHAR(20), -- 仕入日
    sicd VARCHAR(10), -- 仕入先ｺｰﾄﾞ
    siryaku VARCHAR(50), -- 仕入先略名
    gotan VARCHAR(40), -- ご担当者
    smoto VARCHAR(10), -- 出荷元
    smotonm VARCHAR(200), -- 出荷元名
    sitan VARCHAR(40), -- 発注担当者
    torikbn VARCHAR(2), -- 取引区分
    jisyakbn VARCHAR(2), -- 自社区分（0 など／実DBに準拠）
    zaishitu VARCHAR(10), -- 材質
    zaishitunm VARCHAR(20), -- 材質名
    kikaku VARCHAR(20), -- 規格
    kikakunm VARCHAR(20), -- 規格名
    siyo VARCHAR(10), -- 仕様
    siyonm VARCHAR(20), -- 仕様名
    keijyo VARCHAR(10), -- 形状
    tate DOUBLE PRECISION, -- 縦
    yoko DOUBLE PRECISION, -- 横
    atsu DOUBLE PRECISION, -- 板厚
    jyuryo DOUBLE PRECISION, -- 重量
    ssu DOUBLE PRECISION, -- 数量
    stanka DOUBLE PRECISION, -- 単価
    skingu DOUBLE PRECISION, -- 金額
    tesuryo DOUBLE PRECISION, -- 手数料
    hnsun TEXT, -- 商品寸法明細
    PRIMARY KEY (sirno, sirgyo)
);

-- ==========================================
-- テーブル名: hatty_d (発注データ)
-- ==========================================
CREATE TABLE hatty_d (
    hatno VARCHAR(10) NOT NULL, -- 発注No
    gyo VARCHAR(5) NOT NULL, -- 行No
    hatymd VARCHAR(20), -- 発注日
    sicd VARCHAR(10), -- 仕入先ｺｰﾄﾞ
    siryaku VARCHAR(50), -- 仕入先略名
    gotan VARCHAR(40), -- ご担当者
    noki VARCHAR(20), -- 納期
    sitan VARCHAR(40), -- 発注担当者
    smoto VARCHAR(10), -- 出荷元
    maker VARCHAR(50), -- メーカー
    charge VARCHAR(50), -- チャージ
    zaishitu VARCHAR(10), -- 材質
    kikaku VARCHAR(20), -- 規格
    siyo VARCHAR(10), -- 仕様
    keijyo VARCHAR(10), -- 形状
    tate DOUBLE PRECISION, -- 縦
    yoko DOUBLE PRECISION, -- 横
    atsu DOUBLE PRECISION, -- 板厚
    jyuryo DOUBLE PRECISION, -- 重量
    su DOUBLE PRECISION, -- 数量
    tanka DOUBLE PRECISION, -- 単価
    kingu DOUBLE PRECISION, -- 金額
    biko TEXT, -- 備考
    haikbn VARCHAR(1), -- 配送方法
    nyukbn VARCHAR(1), -- 入荷票印字区分
    zaikbn VARCHAR(5), -- 在庫区分 (0:未入荷)
    PRIMARY KEY (hatno, gyo)
);

-- ==========================================
-- テーブル名: tana_d (棚卸データ) ※実DBに準拠
-- ==========================================
CREATE TABLE tana_d (
    nendo VARCHAR(20), -- 年度
    zaikin DOUBLE PRECISION -- 在庫額
    -- その他の列・主キーは実テーブル定義に準拠
);

-- ==========================================
-- テーブル名: zaikom_d (在庫データ・月次) ※実DBに準拠
-- ==========================================
CREATE TABLE zaikom_d (
    nendo VARCHAR(20), -- 集計年度
    zaikin DOUBLE PRECISION -- 在庫額（月次在庫額の集計元）
    -- その他の列・主キーは実テーブル定義に準拠
);
