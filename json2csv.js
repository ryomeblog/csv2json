#!/usr/bin/env node

const fs = require('fs');

// コマンドライン引数の処理
const [,, ...jsonFiles] = process.argv;

// 引数のバリデーション
if (jsonFiles.length === 0) {
    console.error('使用方法: node json2csv.js <JSONファイル1> <JSONファイル2> ...');
    process.exit(1);
}

try {
    // 全てのJSONファイルの読み込みと解析
    const jsonContents = jsonFiles.map(file => {
        const content = fs.readFileSync(file, 'utf-8');
        try {
            return {
                filename: file.replace(/^.*[\\\/]/, '').replace(/\.[^/.]+$/, ''),
                data: JSON.parse(content)
            };
        } catch (e) {
            throw new Error(`JSONファイル '${file}' の解析に失敗しました: ${e.message}`);
        }
    });

    // 全てのキーを収集（重複を除去）
    const allKeys = [...new Set(
        jsonContents.reduce((keys, {data}) => {
            return keys.concat(Object.keys(data));
        }, [])
    )].sort();

    // ヘッダー行の生成
    const headers = ['key', ...jsonContents.map(json => json.filename)];

    // CSVの行を生成
    const rows = [headers];
    allKeys.forEach(key => {
        const row = [key];
        jsonContents.forEach(({data}) => {
            row.push(data[key] || ''); // キーが存在しない場合は空文字を挿入
        });
        rows.push(row);
    });

    // CSVフォーマットに変換（簡易的なCSVエスケープ処理を含む）
    const csvContent = rows.map(row => 
        row.map(cell => {
            // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
            if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',')
    ).join('\n');

    // 出力ファイル名の生成
    const outputFile = 'output.csv';

    // CSVファイルの出力
    fs.writeFileSync(outputFile, csvContent, 'utf-8');
    console.log(`変換が完了しました。出力ファイル: ${outputFile}`);

} catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`エラー: ファイルが見つかりません: ${error.path}`);
    } else {
        console.error('エラーが発生しました:', error.message);
    }
    process.exit(1);
}