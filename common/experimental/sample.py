import openapi_client
from openapi_client.apis.tags import default_api

configuration = openapi_client.Configuration(
    host = "http://localhost"
)


client = openapi_client.ApiClient(configuration)
api = default_api.DefaultApi(client)

user_id=1
api.create_group_group_post(user_id)


# 課題
# 上記のようにクライアントが生成できるものの、メソッド名が微妙
