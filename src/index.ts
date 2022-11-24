import { writeFile } from 'fs/promises';
import { TweetV2UserTimelineParams, TwitterApi } from 'twitter-api-v2';

const user_name = 'c_drosten'
const user_id = '2804548467' // lookup here: https://tweeterid.com/

const makeRequest = async (client, token) => {
    let result
    try {
        let params: TweetV2UserTimelineParams = { max_results: 100 }
        if (token !== "dummy") params.pagination_token = token
        const request = await client.v2.userTimeline(user_id, params)
        result = await request.fetchNext();
    } catch (e) {
        console.log(e)
        if (e.rateLimit.remaining === 0) {
            console.log('Rate limit reached')
            return
        }
    }
    return {
        data: result._realData.data,
        token: result.meta.next_token
    }
}

async function main(): Promise<void> {
    const userClient = new TwitterApi({
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET,
    });
    const client = await userClient.appLogin();

    let final_result = []
    let nextToken = "dummy"
    let i = 1
    while (nextToken) {
        console.log(i++)
        let result = await makeRequest(client, nextToken)
        final_result = final_result.concat(result.data)
        nextToken = result.token
    }

    await writeFile(`./out/${user_name}.json`, JSON.stringify(final_result, null, 2))
}

main()