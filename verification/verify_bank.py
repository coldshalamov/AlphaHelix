from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to Bank page
    print("Navigating to Bank page...")
    page.goto("http://localhost:3000/bank")

    # Wait for the input to be present
    page.wait_for_selector("#buy-amount")

    # Check if type is 'text'
    input_elem = page.locator("#buy-amount")
    input_type = input_elem.get_attribute("type")
    print(f"Buy input type: {input_type}")

    if input_type != "text":
        print("FAIL: Input type is not text")
        browser.close()
        return

    # Check inputMode is 'decimal'
    input_mode = input_elem.get_attribute("inputmode")
    print(f"Buy input mode: {input_mode}")
    if input_mode != "decimal":
        print("FAIL: Input mode is not decimal")

    # Test typing validation
    print("Testing validation...")

    # 1. Type valid number
    input_elem.fill("")
    input_elem.type("123.45")
    val = input_elem.input_value()
    print(f"After typing '123.45', value is '{val}'")
    if val != "123.45":
        print(f"FAIL: Expected '123.45', got '{val}'")

    # 2. Type invalid characters
    input_elem.fill("")
    input_elem.type("1a2b3")
    val = input_elem.input_value()
    print(f"After typing '1a2b3', value is '{val}'")

    # Depending on how fast React updates, 'a' and 'b' should be filtered out.
    # If the regex validation works, they won't appear.
    if val == "123":
        print("PASS: Non-numeric characters filtered out")
    else:
        print(f"FAIL: Validation might be broken. Expected '123', got '{val}'")

    # Take screenshot
    page.screenshot(path="verification/verification_bank.png")
    print("Screenshot saved to verification/verification_bank.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
