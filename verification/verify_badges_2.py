from playwright.sync_api import sync_playwright

def verify_button_badge_style():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()

        try:
            page.goto("http://localhost:3000/bank")
            page.wait_for_selector(".badge")

            # Screenshot the whole page to see the Max button and Copy button
            page.screenshot(path="verification/bank_page_badges_2.png")
            print("Screenshot taken: verification/bank_page_badges_2.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_button_badge_style()
