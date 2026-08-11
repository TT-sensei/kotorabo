# 問題データ仕様 v1.0

問題文例は `js/data/questions.js` の `QUESTIONS` に追加する。画面や出題ロジックへ文例を直接書かない。

## 主な項目

| 項目 | 意味 | 注意 |
|---|---|---|
| `id` | 履歴保存用の固有ID | 公開後は変更しない |
| `version` | 問題内容の版 | 文面・正解基準変更時に上げる |
| `lab` | 4LABのどれか | words/sentence/connection/passage |
| `skill` | SKILL MAPのID | 未定義IDを作らない |
| `subskill` | 一問の焦点 | 一問一焦点にする |
| `contentLevel` | 内容の難しさ | 学年とは別 |
| `depth` | 習熟の深さ | D1〜D6 |
| `purpose` | 主な用途 | diagnostic/practice/transfer |
| `thinkingTags` | 思考内容 | 類題・分析に使う |
| `crossTags` | 横断スキル | 目的、相手、具体と抽象など |
| `theme` | 題材 | 転移時の題材分散に使う |
| `gradeMin` | 最低学年 | 漢字だけで決めない |
| `options` | 選択肢 | best/acceptable/incorrectを設定 |
| `hint` | 小さな手がかり | 正解をそのまま言わない |
| `explanation` | 考え方 | 選択の根拠を短く説明する |

## 国語らしい段階判定

- `best`：目的・相手・場面で最も適切
- `acceptable`：意味は合うが、もっと適切な表現がある
- `incorrect`：文脈、関係、目的のいずれかに合わない

`acceptable` には必ず「なぜ○で、なぜ◎ではないか」を `feedback` に書く。出題者の好みだけで差を付けない。

## 追加前の確認

1. 一問で複数の能力を同時に測っていないか
2. 絶対に違う選択肢ばかりになっていないか
3. ○判定が本当に成立するか
4. 誤答の原因をヒントと解説で扱えるか
5. 同じSKILLを別題材で試す問題があるか
6. 漢字や背景知識だけで国語力を誤判定しないか
