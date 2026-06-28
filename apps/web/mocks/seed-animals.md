-- ==========================================
-- Seed 10 cattle records + initial weights
-- ==========================================

DO $$
DECLARE
    v_org_id UUID;
    v_user_id TEXT;
BEGIN

    -- Get first organization
    SELECT id
    INTO v_org_id
    FROM organizations
    ORDER BY created_at
    LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'No organization found. Create an organization first.';
    END IF;

    -- Get a member user id
    SELECT clerk_user_id
    INTO v_user_id
    FROM memberships
    WHERE organization_id = v_org_id
    ORDER BY created_at
    LIMIT 1;

    IF v_user_id IS NULL THEN
        v_user_id := 'seed-script';
    END IF;

    -- Insert cattle
    INSERT INTO cattle (
        organization_id,
        created_by_user_id,
        tag_number,
        name,
        breed,
        gender,
        date_of_birth,
        status,
        weight_kg,
        acquisition,
        acquired_date,
        notes
    )
    VALUES
    (
        v_org_id, v_user_id,
        'A-1001', 'Bessie',
        'holstein', 'female',
        '2020-04-10', 'active',
        620, 'born_on_farm',
        NULL,
        'Top milker, calm temperament.'
    ),
    (
        v_org_id, v_user_id,
        'A-1002', 'Duke',
        'angus', 'male',
        '2019-08-22', 'active',
        880, 'purchased',
        '2019-11-01',
        'Herd sire.'
    ),
    (
        v_org_id, v_user_id,
        'A-1003', 'Daisy',
        'jersey', 'female',
        '2021-02-15', 'pregnant',
        430, 'born_on_farm',
        NULL,
        'Due this season.'
    ),
    (
        v_org_id, v_user_id,
        'A-1004', 'Rocky',
        'hereford', 'male',
        '2022-06-30', 'active',
        560, 'purchased',
        '2022-09-12',
        NULL
    ),
    (
        v_org_id, v_user_id,
        'A-1005', 'Luna',
        'brown_swiss', 'female',
        '2023-05-18', 'active',
        540, 'born_on_farm',
        NULL,
        NULL
    ),
    (
        v_org_id, v_user_id,
        'A-1006', 'Clover',
        'guernsey', 'female',
        '2018-03-05', 'sick',
        470, 'purchased',
        '2018-06-20',
        'On treatment — recheck in 7 days.'
    ),
    (
        v_org_id, v_user_id,
        'A-1007', 'Thunder',
        'charolais', 'male',
        '2020-12-01', 'active',
        940, 'purchased',
        '2021-02-15',
        NULL
    ),
    (
        v_org_id, v_user_id,
        'A-1008', 'Maple',
        'simmental', 'female',
        '2025-09-10', 'active',
        180, 'born_on_farm',
        NULL,
        'Weaned heifer.'
    ),
    (
        v_org_id, v_user_id,
        'A-1009', 'Bella',
        'holstein', 'female',
        '2021-11-20', 'pregnant',
        650, 'born_on_farm',
        NULL,
        NULL
    ),
    (
        v_org_id, v_user_id,
        'A-1010', 'Ginger',
        'jersey', 'female',
        '2026-02-14', 'active',
        95, 'born_on_farm',
        NULL,
        'Spring calf.'
    );

    -- Create initial weight measurements
    INSERT INTO weight_measurements (
        organization_id,
        cattle_id,
        weight_kg,
        measured_at
    )
    SELECT
        organization_id,
        id,
        weight_kg,
        CURRENT_DATE
    FROM cattle
    WHERE organization_id = v_org_id
      AND tag_number IN (
        'A-1001','A-1002','A-1003','A-1004','A-1005',
        'A-1006','A-1007','A-1008','A-1009','A-1010'
      );

END $$;