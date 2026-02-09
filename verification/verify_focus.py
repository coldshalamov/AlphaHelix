from playwright.sync_api import Page, expect, sync_playwright
import json
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    context.grant_permissions(['clipboard-read', 'clipboard-write'])

    page = context.new_page()

    try:
        # 1. Verify Focus State
        print("Verifying focus state (Mode: Focus)...")
        page.goto("http://localhost:3000/verify")

        page.wait_for_selector("text=Commit phase", timeout=10000)

        # Focus on the first radio button (YES choice)
        yes_label = page.locator("label").filter(has_text="YES").first
        yes_label.click()

        page.screenshot(path="verification/focus_state.png")
        print("Screenshot saved: verification/focus_state.png")

        # 2. Verify Copy Button
        print("Verifying Copy Button (Mode: Copy)...")

        storage_key = "helix_bet_1_0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        bet_data = {
            "marketId": "1",
            "salt": "12345",
            "choice": 1,
            "amount": "1.0",
            "hash": "0x1234567890abcdef"
        }

        # Set localStorage BEFORE navigating or reload after setting
        # We can set it on the current page context
        page.evaluate(f"localStorage.setItem('{storage_key}', '{json.dumps(bet_data)}');")

        # Navigate to copy mode
        page.goto("http://localhost:3000/verify?mode=copy")

        # Wait for "You have committed" text which signifies hasCommitted mode
        page.wait_for_selector("text=You have committed", timeout=10000)

        # Find the backup button
        backup_btn = page.get_by_label("Copy bet secret to clipboard")
        if backup_btn.count() > 0:
            print("Backup button found.")
            backup_btn.click()

            print("Waiting for label update...")
            # Wait for label change
            # Playwright doesn't have a direct "wait for attribute change" on locator easily without polling
            # But we can wait for a selector matching the new attribute
            page.wait_for_selector('[aria-label="Secret copied to clipboard"]', timeout=5000)

            changed_btn = page.get_by_label("Secret copied to clipboard")
            expect(changed_btn).to_be_visible()
            expect(changed_btn).to_have_text("✓ Copied!")

            page.screenshot(path="verification/copy_success.png")
            print("Screenshot saved: verification/copy_success.png")
            print("Verification SUCCESS!")
        else:
            print("Backup button NOT found. Check localStorage logic.")
            page.screenshot(path="verification/error_no_button.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error_exception.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
