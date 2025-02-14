#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parse/sync');

// コマンドライン引数の処理
const [,, csvFile, keyColumn, valueColumn] = process.argv;

// 引数のバリデーション
if (!csvFile || keyColumn === undefined || valueColumn === undefined) {
    console.error('使用方法: node csv2json.js <CSVファイル名> <JSONキーとして扱う列名> <JSONバリューとして扱う列名>');
    process.exit(1);
}

try {
    // CSVファイルの読み込み
    const fileContent = fs.readFileSync(csvFile, 'utf-8');
    
    // CSVのパース
    const records = csv.parse(fileContent, {
        skip_empty_lines: true,
        from_line: 2 // ヘッダー行をスキップ
    });

    // キーと値の列番号を数値に変換
    const keyIdx = parseInt(keyColumn);
    const valueIdx = parseInt(valueColumn);

    // 列番号の妥当性チェック
    if (records.length > 0) {
        const columnCount = records[0].length;
        if (keyIdx >= columnCount || valueIdx >= columnCount) {
            console.error(`エラー: 指定された列番号が範囲外です。CSVファイルには ${columnCount} 列あります。`);
            process.exit(1);
        }
    }

    // JSONオブジェクトの作成
    const result = {};
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        result[record[keyIdx]] = record[valueIdx];
    }

    // 出力ファイル名の生成（入力ファイル名の拡張子をjsonに変更）
    const outputFile = csvFile.replace(/\.[^/.]+$/, '') + '.json';

    // JSONファイルの出力
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`変換が完了しました。出力ファイル: ${outputFile}`);

} catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`エラー: ファイル '${csvFile}' が見つかりません。`);
    } else {
        console.error('エラーが発生しました:', error.message);
    }
    process.exit(1);
}