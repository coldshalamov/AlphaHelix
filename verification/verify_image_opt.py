from playwright.sync_api import sync_playwright

def verify_landing_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the landing page
        try:
            page.goto("http://localhost:3000")
            print("Navigated to localhost:3000")

            # Wait for the image to be attached to DOM
            # The next/image component renders as an <img> tag.
            # We look for the image by its alt text.
            img_locator = page.get_by_alt_text("DNA Helix Background")

            # Wait for it to be visible (it might have opacity but should be in layout)
            img_locator.wait_for(state="visible", timeout=10000)
            print("Found image with alt text 'DNA Helix Background'")

            # Verify attributes indicating optimization
            # Next.js image usually has 'decoding' and 'srcset' attributes
            img_element = img_locator.element_handle()
            src = img_element.get_attribute("src")
            srcset = img_element.get_attribute("srcset")

            print(f"Image src: {src}")
            print(f"Image srcset found: {bool(srcset)}")

            if not srcset:
                print("WARNING: No srcset found. Optimization might not be working as expected (or dev mode behavior).")

            # Take a screenshot to verify visual appearance (gradient overlay, etc.)
            page.screenshot(path="verification/landing_optimization.png")
            print("Screenshot saved to verification/landing_optimization.png")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_landing_page()
