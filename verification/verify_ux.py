import re
from playwright.sync_api import sync_playwright, expect

def verify_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to verify_ux...")
        # Retry logic handled by goto default timeout usually, but server startup might be slow
        for i in range(5):
            try:
                page.goto("http://localhost:3000/verify_ux", timeout=10000)
                break
            except Exception as e:
                print(f"Attempt {i+1} failed: {e}")
                page.wait_for_timeout(2000)

        # Wait for content
        try:
            page.wait_for_selector("h1", timeout=10000)
        except:
             print("Could not find h1. Page content:")
             print(page.content())
             raise

        # Verify initial state (YES is default, should have primary class)
        yes_label = page.locator("label").filter(has_text="YES")
        # Class string usually is "button primary" or "button outline"
        expect(yes_label).to_have_class(re.compile(r"primary"))

        # Click NO
        no_label = page.locator("label").filter(has_text="NO")
        no_label.click()

        # Verify NO has danger class
        expect(no_label).to_have_class(re.compile(r"danger"))

        # Verify YES has outline class
        expect(yes_label).to_have_class(re.compile(r"outline"))

        # Click UNALIGNED
        unaligned_label = page.locator("label").filter(has_text="UNALIGNED")
        unaligned_label.click()

        # Verify UNALIGNED has secondary class
        expect(unaligned_label).to_have_class(re.compile(r"secondary"))

        # Screenshot
        page.screenshot(path="verification/ux_verification.png")
        print("Verification passed and screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_ux()
