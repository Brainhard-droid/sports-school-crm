-- Миграция для обновления ролей пользователей
-- Заменяем роль "employee" на "senior_admin"

-- Создаем временную таблицу для обновления существующих ролей
CREATE TEMP TABLE temp_roles AS
SELECT id, 
       CASE 
           WHEN role = 'employee' THEN 'senior_admin'
           ELSE role
       END as new_role
FROM users
WHERE role = 'employee';

-- Обновляем роли в основной таблице
UPDATE users
SET role = temp_roles.new_role
FROM temp_roles
WHERE users.id = temp_roles.id;

-- Добавляем новое поле access_type в таблицу user_groups, если его ещё нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_groups' AND column_name = 'access_type'
    ) THEN
        ALTER TABLE user_groups 
        ADD COLUMN access_type TEXT NOT NULL DEFAULT 'view';
    END IF;
END $$;

-- Создаем индекс для быстрого поиска по комбинации user_id + group_id
CREATE INDEX IF NOT EXISTS idx_user_groups_user_id_group_id 
ON user_groups(user_id, group_id);