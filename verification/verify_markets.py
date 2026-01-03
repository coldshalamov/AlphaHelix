from playwright.sync_api import sync_playwright

def verify_markets_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000/markets")
            page.wait_for_timeout(5000) # Wait for fetch
            page.screenshot(path="verification/markets_page.png")
            print("Screenshot taken at verification/markets_page.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_markets_page()
