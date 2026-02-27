from playwright.sync_api import sync_playwright, expect
import time

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need a context to grant permissions if needed, though not strictly required here
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to Bank page...")
        # Assuming dev server runs on 3000 by default for Next.js
        try:
            page.goto("http://localhost:3000/bank")
        except Exception as e:
            print(f"Error navigating: {e}")
            # Try default port if 3000 fails, or wait a bit
            time.sleep(5)
            page.goto("http://localhost:3000/bank")

        # Inject some mock data or state if needed.
        # Since we are testing focus management on "Max" buttons, we need the buttons to be enabled.
        # However, the "Max" buttons in Bank.jsx are disabled if !ethBalance or !formattedHlx.
        # We might need to mock the wallet connection or the balance data to enable them.
        # BUT, the prompt said "focus management". If the button is disabled, we can't click it.
        # If we can't connect a wallet in this headless env easily, we might not be able to fully verify the click-to-focus behavior dynamically without mocking.

        # Let's try to verify the static presence of the elements first.
        print("Checking for Bank header...")
        expect(page.get_by_role("heading", name="Helix Bank")).to_be_visible()

        # Take a screenshot of the initial state
        print("Taking initial screenshot...")
        page.screenshot(path="verification/bank_initial.png")

        # To properly test the focus behavior, we ideally need to simulate a connected state.
        # Since real wallet connection is hard in headless, we can try to mock the wagmi hooks or component state.
        # However, modifying the code just for this test is invasive.
        # Alternatively, we can inspect the source code via the browser to see if the event handlers are attached? No, that's hard.

        # Let's try to forcefully enable the buttons via JS to test the focus logic,
        # assuming the logic inside the click handler doesn't crash if balance is missing (it guards checks).
        # Wait, the button is disabled if `!ethBalance`.

        # Let's try to evaluate JS to enable the button and click it.
        # The React `onClick` might rely on `ethBalance` being present in the closure.
        # `handleMaxBuy` checks `if (ethBalance) ...`.
        # If `ethBalance` is undefined, it does nothing.
        # BUT `handleMaxClick` calls `handleMaxBuy()` THEN `inputRef.current?.focus()`.
        # So even if `handleMaxBuy` does nothing, the focus SHOULD happen.

        # So the plan:
        # 1. Force remove 'disabled' attribute from the Max button in BuyCard.
        # 2. Click it.
        # 3. Verify the input has focus.

        print("Attempting to test focus on Buy Card Max button...")

        # Locate the Max button in the Buy card (first one usually, or use accessible name)
        # Accessible name is "Buy with maximum safe ETH"
        buy_max_btn = page.get_by_label("Buy with maximum safe ETH")

        if buy_max_btn.is_visible():
            # Force enable
            print("Force enabling button...")
            page.evaluate("document.querySelector('button[aria-label=\"Buy with maximum safe ETH\"]').disabled = false")

            # Click
            print("Clicking Max button...")
            buy_max_btn.click()

            # Check focus
            print("Verifying focus...")
            buy_input = page.get_by_label("Amount of ETH to spend")

            # Playwright doesn't have a direct "to_be_focused" matcher in python?
            # It does: expect(locator).to_be_focused()
            try:
                expect(buy_input).to_be_focused()
                print("SUCCESS: Buy input received focus!")
            except AssertionError:
                print("FAILURE: Buy input did NOT receive focus.")
        else:
            print("Buy Max button not found or not visible.")

        # Repeat for Sell Card
        print("Attempting to test focus on Sell Card Max button...")
        sell_max_btn = page.get_by_label("Sell maximum available HLX")

        if sell_max_btn.is_visible():
             # Force enable
            print("Force enabling button...")
            page.evaluate("document.querySelector('button[aria-label=\"Sell maximum available HLX\"]').disabled = false")

            # Click
            sell_max_btn.click()

            # Check focus
            sell_input = page.get_by_label("Amount of HLX to sell")
            try:
                expect(sell_input).to_be_focused()
                print("SUCCESS: Sell input received focus!")
            except AssertionError:
                print("FAILURE: Sell input did NOT receive focus.")

        # Take final screenshot
        page.screenshot(path="verification/bank_focus_test.png")
        print("Done.")
        browser.close()

if __name__ == "__main__":
    run_test()
