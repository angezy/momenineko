-- Check if the column "NationalCode" already exists
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Visit_tbl' AND COLUMN_NAME = 'NationalCode'
)
BEGIN
    -- Add the "NationalCode" column to the table
    ALTER TABLE dbo.Visit_tbl
    ADD NationalCode NVARCHAR(50) NULL;

    PRINT 'Column "NationalCode" added successfully.';
END
ELSE
BEGIN
    PRINT 'Column "NationalCode" already exists.';
END
