require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { Octokit } = require('@octokit/rest');

const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN;
const REPO_OWNER = "joshyeom"; 
const REPO_NAME = "learn-ci"; 

const YES24_IT_NEW_PRODUCT_URL = "https://www.yes24.com/Product/Category/AttentionNewProduct?pageNumber=1&pageSize=24&categoryNumber=001001003";

// ✅ 1. YES24 IT 신간 도서 크롤링
async function fetchBookData() {
    try {
        const response = await axios.get(YES24_IT_NEW_PRODUCT_URL);
        const $ = cheerio.load(response.data);
        
        let books = [];
        
        $('.goods_name').each((_, element) => {
            const title = $(element).text().trim();
            const link = "https://www.yes24.com" + $(element).attr('href');
            books.push(`- [${title}](${link})`);
        });

        return books.join("\n");
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// ✅ 2. GitHub Issue 생성
async function createGithubIssue(issueTitle, issueBody) {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    try {
        const response = await octokit.issues.create({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            title: issueTitle,
            body: issueBody
        });

        console.log("✅ GitHub Issue Created:", response.data.html_url);
    } catch (error) {
        console.error("❌ Error creating GitHub Issue:", error);
    }
}

// ✅ 3. 실행 로직
(async () => {
    const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" });
    const issueTitle = `YES24 IT 신간 도서 알림(${today})`;

    const bookData = await fetchBookData();
    if (bookData) {
        await createGithubIssue(issueTitle, bookData);
    }
})();
