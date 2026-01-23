from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to home...")
            page.goto("http://localhost:3000")
            page.wait_for_selector(".hero-title", timeout=10000)
            print("Home loaded.")
            page.screenshot(path="verification/home.png")

            print("Navigating to bank...")
            page.goto("http://localhost:3000/bank")
            page.wait_for_selector(".bank-container", timeout=10000)
            print("Bank loaded.")
            page.screenshot(path="verification/bank.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
