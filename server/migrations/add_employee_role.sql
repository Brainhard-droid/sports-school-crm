-- Проверка существования типа enum user_role
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN
        -- Добавляем новое значение 'employee' в enum, если оно еще не существует
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'employee';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Value ''employee'' already exists in enum user_role';
        END;
    ELSE
        RAISE NOTICE 'Type user_role does not exist';
    END IF;
END
$$;