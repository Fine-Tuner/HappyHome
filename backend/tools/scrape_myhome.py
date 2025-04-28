import argparse
import asyncio
from pathlib import Path

from playwright.async_api import TimeoutError as PlaywrightTimeoutError
from playwright.async_api import async_playwright


def parse_args():
    parser = argparse.ArgumentParser(description="Scrape MyHome website for notices.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("./downloads"),
        help="Directory to save downloaded PDF files.",
    )
    parser.add_argument(
        "--start-id",
        type=int,
        default=1000,
        help="Starting pblancId.",
    )
    parser.add_argument(
        "--end-id",
        type=int,
        default=17000,
        help="Ending pblancId (inclusive).",
    )
    return parser.parse_args()


async def scrape_myhome(
    output_dir: Path, start_pblancId: int = 1000, end_pblancId: int = 17000
):
    output_dir.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})

        for pblanc_id in range(end_pblancId, start_pblancId - 1, -1):
            print(f"▶️ Processing ID {pblanc_id}")

            # ---- fast-exit if already downloaded ----
            downloaded = False
            for file in output_dir.glob("*.pdf"):
                if file.stem.endswith(str(pblanc_id)):
                    print(f"  ✅ Already downloaded for ID {pblanc_id}")
                    downloaded = True
                    break
            if downloaded:
                continue

            detail_url = (
                "https://www.myhome.go.kr"
                "/hws/portal/sch/selectRsdtRcritNtcDetailView.do"
                f"?pblancId={pblanc_id}"
            )

            page = await context.new_page()
            try:
                await page.goto(detail_url, wait_until="networkidle", timeout=10_000)

                # REGION lookup
                region_loc = page.locator("span#spanRegion")
                if await region_loc.count() == 0:
                    print("  ⚠️ No region found, skipping.")
                    continue
                region = (await region_loc.text_content() or "").strip()
                if not region:
                    print("  ⚠️ Empty region text, skipping.")
                    continue

                download_path = output_dir / f"{region}_{pblanc_id}.pdf"
                print(f"  📥 Will save to: {download_path.name}")

                # FIND the "공고문" link
                if await page.get_by_text("공고문").count() == 0:
                    print("  ⚠️ '공고문' link not found, skipping.")
                    continue

                # DOWNLOAD
                try:
                    async with page.expect_download(timeout=20_000) as dl_info:
                        link = page.locator('td:right-of(:text("공고문")) a').first
                        if await link.count() == 0:
                            print("  ⚠️ Download anchor missing, skipping.")
                            continue

                        txt = (await link.text_content() or "").strip()
                        if not txt:
                            print("  ⚠️ Link has no text, skipping.")
                            continue

                        await link.click()
                    download = await dl_info.value
                    await download.save_as(str(download_path))
                    print(f"  ✅ Downloaded: {download_path.name}")

                except PlaywrightTimeoutError:
                    print("  ❌ Download did not start in time, skipping.")
                except Exception as dl_err:
                    print(f"  ❌ Download error: {dl_err}")

            except PlaywrightTimeoutError:
                print(f"  ❌ Page load timed out, skipping ID {pblanc_id}")
            except Exception as nav_err:
                print(f"  ❌ Navigation error: {nav_err}")
            finally:
                await page.close()

        await browser.close()


if __name__ == "__main__":
    args = parse_args()
    output_dir = Path(args.output_dir)

    asyncio.run(
        scrape_myhome(
            output_dir=args.output_dir,
            start_pblancId=args.start_id,
            end_pblancId=args.end_id,
        )
    )
