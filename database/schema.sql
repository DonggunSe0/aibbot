-- 데이터베이스 생성 (만약 데이터베이스가 이미 존재하지 않는 경우에만 생성)
-- CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci : 한글 및 다양한 문자를 지원하기 위한 권장 설정
CREATE DATABASE IF NOT EXISTS seoul_childcare_db
    DEFAULT CHARACTER SET = 'utf8mb4'
    DEFAULT COLLATE = 'utf8mb4_unicode_ci';

-- 생성된 (또는 이미 존재하는) 데이터베이스를 사용하도록 지정
USE seoul_childcare_db;

-- 'policies' 테이블 생성 (만약 테이블이 이미 존재하지 않는 경우에만 생성)
-- 서울시 출산/육아 관련 정책 정보를 저장하기 위한 테이블
CREATE TABLE IF NOT EXISTS policies (
    -- 각 정책 레코드를 고유하게 식별하기 위한 기본 키 (자동으로 1씩 증가)
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- 서울열린데이터광장 Open API ('VwSmpBizInfo') 에서 제공하는 필드들
    biz_lclsf_nm VARCHAR(50) COMMENT '사업대분류명',
    biz_mclsf_nm VARCHAR(50) COMMENT '사업중분류명',
    biz_sclsf_nm VARCHAR(50) COMMENT '사업소분류명',
    biz_nm VARCHAR(255) UNIQUE COMMENT '사업명 (고유해야 하므로 UNIQUE 제약조건 추가)',
    biz_cn TEXT COMMENT '사업내용 (길이가 길 수 있으므로 TEXT)',
    utztn_trpr_cn TEXT COMMENT '이용대상내용',
    utztn_mthd_cn TEXT COMMENT '이용방법내용',
    oper_hr_cn TEXT COMMENT '운영시간내용 (길이 문제로 TEXT 타입 사용)',
    aref_cn TEXT COMMENT '문의처내용',
    trgt_child_age VARCHAR(100) COMMENT '대상아동나이',
    trgt_itrst VARCHAR(255) COMMENT '대상관심',
    trgt_rgn VARCHAR(255) COMMENT '대상지역',
    deviw_site_addr VARCHAR(500) COMMENT '자세히보기사이트주소',
    aply_site_addr VARCHAR(500) COMMENT '신청하기사이트주소',

    -- 데이터 관리의 편의성을 위한 타임스탬프 컬럼
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '레코드 생성 시각 (자동 기록)',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '레코드 마지막 수정 시각 (자동 업데이트)'
) COMMENT '서울시 출산/육아 정책 정보 테이블';

-- (선택 사항) 테이블 생성 후 성능 향상을 위해 필요한 인덱스(Index)를 추가할 수 있습니다.
-- 예시: 사업명으로 자주 검색한다면 아래와 같이 인덱스를 추가하는 것이 좋습니다.
-- CREATE INDEX idx_biz_nm ON policies(biz_nm);

-- 'users' 테이블 생성 (만약 테이블이 이미 존재하지 않는 경우에만 생성)
-- 사용자 정보 (아이디, 비밀번호 해시 등)를 저장하기 위한 테이블
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL COMMENT '사용자 아이디',
    password_hash VARCHAR(255) NOT NULL COMMENT '해시된 비밀번호',
    email VARCHAR(120) UNIQUE COMMENT '사용자 이메일 (선택적)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '계정 생성 시각'
) COMMENT '사용자 정보 테이블';