# Introduction

mkdocsを利用した静的サイトジェネレータです。マークダウンファイルの簡単な管理で静的サイトを生成できます。

# Getting Started

## ドキュメントサーバの起動

ドキュメント編集環境を構築するには次のコマンドでドキュメントサーバを起動してください。起動したドキュメントサーバのURLにアクセスするとドキュメントのプレビューを確認できます。

``` python
poetry install
```

``` shell
make doc-serve
```

## ドキュメントのビルド

次のコマンドを実行すると`site`ディレクトリに成果物が出力されます。

``` shell
make doc-build
```

# ディレクトリ・ファイル構成

## mkdocs.yml

ドキュメント生成時のコンフィグファイルです。

## docs

静的サイトを生成するためのドキュメントです。


# ドキュメント編集ガイド

基本的な使い方は公式サイトを参照ください。

- [mkdocs](https://squidfunk.github.io/mkdocs-material/reference/abbreviations/)

## アイコンリスト

アイコンを配置する時、次のリンクからアイコンを検索できます。

- https://squidfunk.github.io/mkdocs-material/reference/icons-emojis/#emoji

### material icons

Google社が公開しているマテリアルデザインのガイドラインに基づいて作成された公式のアイコンセットです。


### fontawesome

Font Awesomeとは、商用利用が可能で、自身のウェブサイトやアプリケーション、WordやPDFなどのドキュメントにも埋め込めるWebアイコンフォントです。

### octicons
軽量のアイコン集です。基本的なアイコンはそろっている。

## ロゴ

https://www.brandcrowd.com/で作成した。


## 印刷・pdf出力

### mkdocs-print-site-plugin

mkdocs-print-site-pluginを使って、すべてのページをまとめた印刷用ページを生成する。ブラウザの印刷からサイト全体を印刷・PDF出力が可能。

mkdocs.ymlのexcludeで任意のページを除外することが可能。

``` yml
      exclude:
        - "index.md"
```

PDF印刷などで改ページの都合が悪い場合は、次のコードを任意の行に配置することで改ページを強制できる。

``` html
<div style="page-break-before:always" /></div>
```

ページは非表示の方がよさそう。
表紙と目次が不要ならブラウザで印刷ページを指定できる。ちょっと見つけづらい。