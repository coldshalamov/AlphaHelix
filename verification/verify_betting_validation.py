from playwright.sync_api import sync_playwright, expect
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to a market page
    print("Navigating to market page...")
    page.goto("http://localhost:3000/markets/0")

    # Wait for the widget to appear
    print("Waiting for widget...")
    expect(page.get_by_text("Commit phase")).to_be_visible()

    # Find the input "Amount to Stake"
    print("Finding input...")
    amount_input = page.get_by_label("Amount to Stake")
    expect(amount_input).to_be_visible()

    # Fill with invalid format "1e5" (scientific notation, rejected by our regex)
    print("Filling invalid input...")
    amount_input.fill("1e5")

    # Click Commit
    print("Clicking commit...")
    page.get_by_role("button", name="Commit bet").click()

    # Expect error message
    print("Checking for error...")
    expect(page.locator("#status-message")).to_contain_text("Invalid HLX amount format.")

    # Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="/home/jules/verification/verification.png")

    browser.close()
    print("Done.")

with sync_playwright() as playwright:
    run(playwright)
