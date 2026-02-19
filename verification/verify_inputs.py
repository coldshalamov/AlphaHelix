from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000/bank")

        # Wait for the page content to load
        page.wait_for_selector("h2", timeout=10000)

        # Verify Buy Input
        buy_input = page.locator("#buy-amount")
        expect(buy_input).to_be_visible()
        expect(buy_input).to_have_attribute("type", "text")
        expect(buy_input).to_have_attribute("inputmode", "decimal")

        # Verify Sell Input
        sell_input = page.locator("#sell-amount")
        expect(sell_input).to_be_visible()
        expect(sell_input).to_have_attribute("type", "text")
        expect(sell_input).to_have_attribute("inputmode", "decimal")

        # Test typing behavior
        # Typing invalid characters (should be rejected by React state logic, result empty)
        buy_input.fill("abc")
        expect(buy_input).to_have_value("")

        # Typing valid decimal
        buy_input.fill("1.5")
        expect(buy_input).to_have_value("1.5")

        print("Bank inputs verified successfully.")

        # Take screenshot
        page.screenshot(path="verification/verification.png")

    except Exception as e:
        print(f"Verification failed: {e}")
        page.screenshot(path="verification/error.png")
        raise e
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
