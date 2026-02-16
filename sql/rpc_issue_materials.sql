CREATE OR REPLACE FUNCTION issue_materials(
    p_project_id uuid,
    p_issue_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    inventory_issue jsonb;
    vendor_purchase jsonb;
    v_inventory_item_id uuid;
    v_vendor_purchase_id uuid;
    v_available_qty integer;
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated';
    END IF;

    /* ---------------------------------------------
       1. ISSUE FROM EXISTING INVENTORY
    ----------------------------------------------*/
    IF p_issue_payload ? 'inventory_issues' THEN
        FOR inventory_issue IN
            SELECT * FROM jsonb_array_elements(p_issue_payload->'inventory_issues')
        LOOP
            -- Check stock
            SELECT total_quantity
            INTO v_available_qty
            FROM inventory_items
            WHERE id = (inventory_issue->>'inventory_item_id')::uuid
            FOR UPDATE;

            IF v_available_qty < (inventory_issue->>'quantity')::integer THEN
                RAISE EXCEPTION
                  'Insufficient stock for inventory_item_id %',
                  inventory_issue->>'inventory_item_id';
            END IF;

            INSERT INTO material_issues (
                project_id,
                inventory_item_id,
                quantity,
                rate_at_issue,
                issued_by
            )
            VALUES (
                p_project_id,
                (inventory_issue->>'inventory_item_id')::uuid,
                (inventory_issue->>'quantity')::integer,
                (inventory_issue->>'rate_at_issue')::numeric,
                v_user_id
            );

            -- Decrease stock
            INSERT INTO inventory_history (
                inventory_item_id,
                quantity_change,
                reason,
                created_by
            )
            VALUES (
                (inventory_issue->>'inventory_item_id')::uuid,
                -(inventory_issue->>'quantity')::integer,
                'issue',
                v_user_id
            );
        END LOOP;
    END IF;

    /* ---------------------------------------------
       2. DIRECT VENDOR PURCHASE + ISSUE
       (ADMIN ONLY)
    ----------------------------------------------*/
    IF p_issue_payload ? 'vendor_purchases' THEN

        -- Assuming get_my_role() is defined and returns the user's role
        IF (SELECT role FROM profiles WHERE id = v_user_id) <> 'admin' THEN
            RAISE EXCEPTION 'Only admin can record vendor purchases';
        END IF;

        FOR vendor_purchase IN
            SELECT * FROM jsonb_array_elements(p_issue_payload->'vendor_purchases')
        LOOP
            -- Inventory item MUST already exist
            SELECT id INTO v_inventory_item_id
            FROM inventory_items
            WHERE id = (vendor_purchase->>'inventory_item_id')::uuid;

            IF v_inventory_item_id IS NULL THEN
                RAISE EXCEPTION 'Inventory item does not exist';
            END IF;

            -- Create vendor purchase
            INSERT INTO vendor_purchases (
                vendor_id,
                payment_status,
                total_amount,
                created_by
            )
            VALUES (
                (vendor_purchase->>'vendor_id')::uuid,
                (vendor_purchase->>'payment_status')::payment_status,
                (vendor_purchase->>'quantity')::integer *
                (vendor_purchase->>'rate')::numeric,
                v_user_id
            )
            RETURNING id INTO v_vendor_purchase_id;

            -- Purchase items
            INSERT INTO vendor_purchase_items (
                purchase_id,
                inventory_item_id,
                quantity,
                rate
            )
            VALUES (
                v_vendor_purchase_id,
                v_inventory_item_id,
                (vendor_purchase->>'quantity')::integer,
                (vendor_purchase->>'rate')::numeric
            );

            -- Add stock
            INSERT INTO inventory_history (
                inventory_item_id,
                quantity_change,
                reason,
                created_by
            )
            VALUES (
                v_inventory_item_id,
                (vendor_purchase->>'quantity')::integer,
                'purchase',
                v_user_id
            );

            -- Issue to project
            INSERT INTO material_issues (
                project_id,
                inventory_item_id,
                quantity,
                rate_at_issue,
                issued_by
            )
            VALUES (
                p_project_id,
                v_inventory_item_id,
                (vendor_purchase->>'quantity')::integer,
                (vendor_purchase->>'rate')::numeric,
                v_user_id
            );
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'status', 'success'
    );

END;
$$;