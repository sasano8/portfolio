GENERATOR=python
INPUT=openapi.json
OUT=generated

rm -rf ${OUT}
docker run --rm -u `id -u`:`id -g` -v ${PWD}:/local openapitools/openapi-generator-cli generate -g ${GENERATOR} -i /local/${INPUT} -o /local/${OUT}

# Generator 一覧を取得
# docker run --rm openapitools/openapi-generator-cli list
