require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { Octokit } = require('@octokit/rest');
// GitHub Actions 환경인지 확인
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

// 환경에 따라 다른 방식으로 토큰 가져오기
const GITHUB_TOKEN = isGitHubActions 
    ? secrets.GITHUB_TOKEN           // GitHub Actions 환경
    : process.env.GITHUB_TOKEN;       // 로컬 환경
const REPO_OWNER = "thepsyentist-public"; 
const REPO_NAME = "learn-ci"; 

const YES24_IT_NEW_PRODUCT_URL = "https://www.yes24.com/Product/Category/AttentionNewProduct?pageNumber=1&pageSize=24&categoryNumber=001001003";

// ✅ 1. YES24 IT 신간 도서 크롤링
async function fetchBookData() {
    try {
        console.log("크롤링 시작...");
        const response = await axios.get(YES24_IT_NEW_PRODUCT_URL);
        console.log("페이지 로드 완료");
        const $ = cheerio.load(response.data);
        
        let books = [];
        
        $('.gd_name').each((_, element) => {
            const title = $(element).text().trim();
            const link = "https://www.yes24.com" + $(element).attr('href');
            books.push(`- [${title}](${link})`);
        });

        console.log(`총 ${books.length}개의 책을 찾았습니다`);
        return books.join("\n");
    } catch (error) {
        console.error("크롤링 중 에러 발생:", error.message);
        if (error.response) {
            console.error("응답 상태:", error.response.status);
            console.error("응답 데이터:", error.response.data);
        }
        return null;
    }
}

// ✅ 2. GitHub Issue 생성
async function createGithubIssue(issueTitle, issueBody) {
    if (!GITHUB_TOKEN) {
        console.error("GitHub 토큰이 설정되지 않았습니다!");
        return;
    }

    console.log("GitHub Issue 생성 시도...");
    console.log("토큰 확인:", GITHUB_TOKEN ? "설정됨" : "설정되지 않음");
    
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
        console.error("GitHub Issue 생성 중 에러:");
        console.error("에러 메시지:", error.message);
        if (error.response) {
            console.error("GitHub API 응답:", error.response.data);
        }
    }
}

// ✅ 3. 실행 로직
(async () => {
    console.log("프로그램 시작");
    const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" });
    console.log("생성할 이슈 날짜:", today);

    const bookData = await fetchBookData();
    if (bookData) {
        console.log("크롤링 데이터 확보, 이슈 생성 시도");
        await createGithubIssue(`YES24 IT 신간 도서 알림(${today})`, bookData);
    } else {
        console.log("크롤링 데이터를 가져오지 못했습니다");
    }
    console.log("프로그램 종료");
})();
