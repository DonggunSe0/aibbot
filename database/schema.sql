-- database/schema.sql (호환성 개선 버전)

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS seoul_childcare_db DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;

USE seoul_childcare_db;

-- 'policies' 테이블 생성
CREATE TABLE IF NOT EXISTS policies (
    id INT AUTO_INCREMENT PRIMARY KEY,

-- 서울열린데이터광장 Open API 필드들
biz_lclsf_nm VARCHAR(50) COMMENT '사업대분류명',
biz_mclsf_nm VARCHAR(50) COMMENT '사업중분류명',
biz_sclsf_nm VARCHAR(50) COMMENT '사업소분류명',
biz_nm VARCHAR(255) UNIQUE COMMENT '사업명 (고유해야 하므로 UNIQUE 제약조건)',
biz_cn TEXT COMMENT '사업내용',
utztn_trpr_cn TEXT COMMENT '이용대상내용',
utztn_mthd_cn TEXT COMMENT '이용방법내용',
oper_hr_cn TEXT COMMENT '운영시간내용',
aref_cn TEXT COMMENT '문의처내용',
trgt_child_age VARCHAR(100) COMMENT '대상아동나이',
trgt_itrst VARCHAR(255) COMMENT '대상관심',
trgt_rgn VARCHAR(255) COMMENT '대상지역',
deviw_site_addr VARCHAR(500) COMMENT '자세히보기사이트주소',
aply_site_addr VARCHAR(500) COMMENT '신청하기사이트주소',

-- 변경사항 추적을 위한 컬럼
content_hash VARCHAR(32) COMMENT '정책 내용의 MD5 해시값 (변경사항 감지용)',

-- 타임스탬프 컬럼
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '레코드 생성 시각',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '레코드 마지막 수정 시각'
) COMMENT '서울시 출산/육아 정책 정보 테이블 (변경사항 추적 기능 포함)';

-- 'users' 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL COMMENT '사용자 아이디',
    password_hash VARCHAR(255) NOT NULL COMMENT '해시된 비밀번호',
    email VARCHAR(120) UNIQUE COMMENT '사용자 이메일 (선택적)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '계정 생성 시각'
) COMMENT '사용자 정보 테이블';

-- 동기화 로그 테이블
CREATE TABLE IF NOT EXISTS sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('manual', 'scheduled') NOT NULL COMMENT '동기화 유형',
    new_policies INT DEFAULT 0 COMMENT '신규 정책 수',
    updated_policies INT DEFAULT 0 COMMENT '업데이트된 정책 수',
    unchanged_policies INT DEFAULT 0 COMMENT '변경 없는 정책 수',
    total_processed INT DEFAULT 0 COMMENT '처리된 총 정책 수',
    duration_seconds DECIMAL(10, 2) COMMENT '소요 시간 (초)',
    success BOOLEAN DEFAULT TRUE COMMENT '성공 여부',
    error_message TEXT COMMENT '오류 메시지 (실패 시)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '동기화 실행 시각'
) COMMENT '정책 동기화 로그 테이블';

-- 인덱스 생성 (호환성을 위해 개별 실행)
-- 기본 인덱스들
CREATE INDEX idx_biz_nm ON policies (biz_nm);

CREATE INDEX idx_created_at ON policies (created_at);

CREATE INDEX idx_updated_at ON policies (updated_at);

CREATE INDEX idx_content_hash ON policies (content_hash);

CREATE INDEX idx_recent_changes ON policies (created_at, updated_at);

-- 샘플 데이터 확인용 뷰
CREATE VIEW recent_policy_changes AS
SELECT
    id,
    biz_nm,
    biz_mclsf_nm,
    CASE
        WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'new'
        WHEN updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND updated_at > created_at THEN 'updated'
        ELSE 'existing'
    END as change_type,
    created_at,
    updated_at
FROM policies
WHERE (
        created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    )
    OR (
        updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND updated_at > created_at
    )
ORDER BY
    CASE
        WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN created_at
        ELSE updated_at
    END DESC;