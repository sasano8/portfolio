# Getting Started

``` python
poetry install
```

``` shell
make doc-serve
```

# ドキュメント

- [mkdocs](https://squidfunk.github.io/mkdocs-material/reference/abbreviations/)

# アイコンリスト

次のリンクからアイコンを検索できます。

- https://squidfunk.github.io/mkdocs-material/reference/icons-emojis/#emoji

material
fontawesome
octicons

# ロゴ

https://www.brandcrowd.com/で作成した。


# pdf化

ページの改行やレンダリングの問題があり、完璧なpdfは難しい。
ドキュメントサーバを起動して次のコマンド出力して力技で編集する。

```
mkdir pdf
wkhtmltopdf http://localhost:8001/ pdf/p1.pdf
wkhtmltopdf http://localhost:8001/tech_stack pdf/p2.pdf
wkhtmltopdf http://localhost:8001/background pdf/p3.pdf
```

mkdocs-pdf-export-plugin + weasyprintはsvgが上手く出力できなかった。

オンラインエディタ
https://smallpdf.com/jp/delete-pages-from-pdf?job=1628655952929