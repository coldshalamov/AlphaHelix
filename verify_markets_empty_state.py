from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/markets")

        # Wait for the empty state to appear
        # It should appear immediately due to my forced change
        page.wait_for_selector("text=No active markets")

        page.screenshot(path="verification_markets_empty.png")
        browser.close()

if __name__ == "__main__":
    run()
