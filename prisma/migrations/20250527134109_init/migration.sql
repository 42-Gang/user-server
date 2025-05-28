-- AlterTable
ALTER TABLE `friend`
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- 1) NULL 허용 상태로 update_at 컬럼 추가
ALTER TABLE `friend`
    ADD COLUMN `updated_at` DATETIME(3) NULL AFTER `created_at`;

-- 2) 기존 레코드에 값 채우기
UPDATE `friend`
SET `updated_at` = `created_at`;

-- 3) NOT NULL 제약 걸기
ALTER TABLE `friend`
    MODIFY COLUMN `updated_at` DATETIME(3) NOT NULL;