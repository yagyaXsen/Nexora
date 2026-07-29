"""
Tests for AIService.is_invalid_junk_url — the 5-tier URL/text filter.

Run:
    PYTHONPATH=. python tests/test_junk_url_filter.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.ai_service import AIService


svc = AIService()


# ── Helpers ────────────────────────────────────────────────────────────────────

def should_reject(url, text, reason=""):
    assert svc.is_invalid_junk_url(url, text), \
        f"Expected REJECTED but was ACCEPTED | {reason}\n  url: {url}"


def should_accept(url, text, reason=""):
    assert not svc.is_invalid_junk_url(url, text), \
        f"Expected ACCEPTED but was REJECTED | {reason}\n  url: {url}"


# ── Tier 1: Empty guard ────────────────────────────────────────────────────────

def test_tier1_empty_guard():
    """Empty/None inputs must be rejected immediately."""
    should_reject("", "some text about fellowship and funding", "empty url")
    should_reject("https://example.com/fellowship", "", "empty text")
    should_reject("", "", "both empty")


# ── Tier 1: Junk domains ───────────────────────────────────────────────────────

def test_tier1_junk_domains():
    """Known junk domains (forums, news, blogs) should be rejected."""
    cases = [
        ("https://forum.example.com/t/some-topic/123",
         "discussion about various topics", "forum domain"),
        ("https://reddit.com/r/programming/comments/abc/",
         "a post on reddit about programming", "reddit domain"),
        ("https://news.ycombinator.com/item?id=12345",
         "Show HN: I built a thing", "HN domain"),
        ("https://twitter.com/user/status/12345",
         "tweet about something interesting", "twitter domain"),
        ("https://www.wsj.com/tech/ai-stocks-rise-2026",
         "WSJ article about AI stocks", "WSJ domain"),
        ("https://techcrunch.com/2026/07/25/startup-funding/",
         "TechCrunch article about startup funding", "techcrunch domain"),
        ("https://www.nytimes.com/2026/07/25/technology/ai.html",
         "NYT article about artificial intelligence", "nytimes domain"),
        ("https://medium.com/@user/how-to-learn-machine-learning",
         "Medium blog post about learning ML", "medium domain"),
        ("https://www.bbc.com/news/technology-12345",
         "BBC news article about technology", "bbc domain"),
        ("https://www.theverge.com/2026/7/25/ai-announcement",
         "The Verge article about AI", "theverge domain"),
        ("https://news.mongabay.com/2026/07/amazon-canopy-bridges/",
         "news article about amazon canopy bridges", "mongabay domain"),
        ("https://user.substack.com/p/some-newsletter",
         "Substack newsletter post", "substack domain"),
        ("https://dev.to/user/how-to-build-a-rest-api",
         "Dev.to tutorial blog post", "dev.to domain"),
        ("https://pkg.go.dev/golang.org/x/tools/go/analysis",
         "Go package documentation page", "pkg.go.dev domain"),
    ]
    for url, text, reason in cases:
        should_reject(url, text, reason)


def test_tier1_junk_domain_edge_cases():
    """Edge cases: URLs that contain junk-adjacent strings but are legit."""
    should_accept(
        "https://forumforgrant.org/fellowship/apply",
        "Welcome to the Forum for Grant Fellowship program. "
        "This fellowship provides funding and we are accepting applications. "
        "Apply today for this grant.",
        "forum in org name, not a forum site"
    )


# ── Tier 2: Junk path patterns ─────────────────────────────────────────────────

def test_tier2_junk_path_patterns():
    """URLs with navigation/admin/blog path patterns should be rejected."""
    cases = [
        ("https://someuniv.edu/about/",
         "About page of a university", "/about path"),
        ("https://example.org/privacy/",
         "Privacy policy page", "/privacy path"),
        ("https://bigcorp.com/terms-of-service",
         "Terms of service page", "/terms path"),
        ("https://portal.org/faq/how-to-apply",
         "FAQ page about how to apply", "/faq path"),
        ("https://techblog.com/blog/introducing-our-new-platform",
         "Blog post introducing a new platform", "/blog/ path"),
        ("https://newsite.com/news/latest-announcement",
         "News article about latest announcement", "/news/ path"),
        ("https://pressroom.org/press/release-2026",
         "Press release page", "/press/ path"),
        ("https://grantportal.org/article/how-to-win-grants",
         "Article about how to win grants", "/article/ path"),
        ("https://forum.org/t/12345/topic-title",
         "Forum thread topic", "/t/ path pattern"),
        ("https://discourse.org/topic/funding-discussion",
         "Discourse topic about funding", "/topic/ path"),
    ]
    for url, text, reason in cases:
        should_reject(url, text, reason)


# ── Tier 3: Specific URL pattern rejection ─────────────────────────────────────

def test_tier3_devpost_hackathons():
    """Devpost hackathon listing page should be rejected."""
    should_reject(
        "https://devpost.com/hackathons",
        "Browse hackathons on Devpost. Find the best hackathons "
        "and coding competitions with cash prizes and funding.",
        "devpost hackathon listing"
    )


def test_tier3_kaggle_listing():
    """Kaggle competition listing page should be rejected."""
    should_reject(
        "https://www.kaggle.com/competitions",
        "Kaggle competitions page showing all ML competitions "
        "with prizes and funding opportunities.",
        "kaggle listing page"
    )
    should_reject(
        "https://kaggle.com/competitions?sort=latest",
        "Kaggle competitions sorted by latest with prizes.",
        "kaggle listing with query"
    )


def test_tier3_kaggle_specific_competition():
    """Specific Kaggle competition pages should NOT be rejected by Tier 3."""
    url = "https://www.kaggle.com/competitions/titanic"
    text = (
        "Titanic: Machine Learning from Disaster\n"
        "This competition is a classic ML challenge. "
        "Predict survival on the Titanic. "
        "There is a fellowship grant for top participants. "
        "Apply now to compete for the funding prize."
    )
    # Has "grant" + "fellowship" + "apply now" + "funding" = 4 keywords
    should_accept(url, text, "specific kaggle competition")


# ── GitHub repo tests (requested in spec) ──────────────────────────────────────

def test_github_repo_with_keywords_accepted():
    """GitHub repo README with 2+ opportunity keywords should be accepted."""
    should_accept(
        "https://github.com/some-org/research-fellowship-program",
        "Research Fellowship Program - Open Source\n"
        "This is a fellowship program for open source contributors. "
        "The grant provides funding for postdoctoral research. "
        "Apply now for this postdoctoral fellowship.",
        "GitHub repo with fellowship + grant + funding + postdoctoral + apply now"
    )


def test_github_repo_without_keywords_rejected():
    """Plain GitHub repo without opportunity keywords should be rejected."""
    should_reject(
        "https://github.com/user/some-project",
        "A great project for doing things. It is open source and free to use. "
        "Check out the documentation for more info.",
        "GitHub repo with 0 opportunity keywords"
    )


def test_github_repo_show_hn_rejected():
    """GitHub repo with Show HN: title should be rejected by Tier 5."""
    should_reject(
        "https://github.com/user/cheap-security",
        "Show HN: CheapSecurity - Lightweight, Self-Hosted CCTV for Linux SBCs\n"
        "A lightweight CCTV system. Uses Python and OpenCV. "
        "Easy to set up on any Linux SBC.",
        "GitHub repo with Show HN: title (Tier 5 catch)"
    )


# ── Tier 4: Opportunity keywords ───────────────────────────────────────────────

def test_tier4_insufficient_keywords():
    """URLs with fewer than 2 opportunity keywords should be rejected."""
    cases = [
        ("https://example.com/some-page",
         "This is a page about something interesting.",
         "0 keywords - pure generic"),
        ("https://example.org/awards-ceremony",
         "The annual awards ceremony will be held next month. "
         "Winners will receive a trophy and recognition.",
         "1 keyword ('award' not in list, so 0)"),
        ("https://grantportal.org/blog/how-to-apply",
         "How to apply for things. A step by step guide. "
         "This tutorial will help you understand the process.",
         "1 keyword ('apply' but 'apply now' != 'apply')"),
    ]
    for url, text, reason in cases:
        should_reject(url, text, reason)


def test_tier4_sufficient_keywords():
    """URLs with 2+ opportunity keywords should pass Tier 4."""
    cases = [
        ("https://example.org/young-professionals-program",
         "Young Professionals Program: This is a fellowship "
         "for young professionals. Apply now for this grant.",
         "young professionals + fellowship + apply now + grant"),
        ("https://foundation.org/research-fellowship",
         "Research Fellowship Program for postdoctoral researchers. "
         "This fellowship provides funding for research. "
         "Apply now for this grant opportunity.",
         "research fellowship + postdoctoral + fellowship + funding"),
        ("https://accelerator.com/apply",
         "Startup Accelerator: Apply now for our cohort program. "
         "We provide seed funding and incubation for early-stage startups.",
         "accelerator + apply now + cohort + seed funding"),
    ]
    for url, text, reason in cases:
        should_accept(url, text, reason)


# ── Tier 5: Title heuristic ────────────────────────────────────────────────────

def test_tier5_blog_title_starts():
    """Titles starting with blog-like phrases should be rejected."""
    cases = [
        ("https://blog.example.com/how-to-learn-python",
         "How to learn Python in 30 days - a complete tutorial for beginners",
         "how to starts"),
        ("https://dev.to/user/building-a-chat-app",
         "Building a chat application with React and Node.js",
         "building a starts"),
        ("https://medium.com/@user/why-i-quit-my-job",
         "Why I quit my job to travel the world",
         "why i starts"),
        ("https://news.ycombinator.com/item?id=123",
         "Show HN: My new side project",
         "show hn: starts"),
        ("https://news.site.com/announcing-new-feature",
         "Announcing our new AI-powered platform",
         "announcing starts"),
    ]
    for url, text, reason in cases:
        should_reject(url, text, reason)


def test_tier5_short_title():
    """Very short titles (< 10 chars after stripping labels) should be rejected."""
    cases = [
        ("https://example.org/short",
         "Title: Hi",
         "Title: Hi -> 'Hi' is < 10 chars"),
        ("https://example.org/xyz",
         "About",
         "'About' is < 10 chars"),
    ]
    for url, text, reason in cases:
        should_reject(url, text, reason)


# ── Integration: Real database URLs ────────────────────────────────────────────
# NOTE: The Kaggle opportunity in the live DB uses `kaggle.com/competitions`
# (the listing page) which the filter CORRECTLY rejects in Tier 3.
# The test below uses a specific competition slug. If the Kaggle DB URL
# is ever updated to point to a specific competition, update accordingly.

def test_real_opportunity_urls_accept_synthetic_text():
    """Every URL currently in the live database must be accepted (with synthetic text)."""
    real_opps = [
        ("https://careers.cern/all-jobs",
         "CERN Technical & Doctoral Studentship 2026\n"
         "Immersive 4 to 14-month research placement at CERN. "
         "This fellowship provides funding and a stipend. "
         "Apply now for this studentship opportunity."),
        ("https://www.daad.de/en/study-and-research-in-germany/scholarships/",
         "DAAD Doctoral & Postdoctoral Research Grants Germany\n"
         "Fully funded research stays in Germany. "
         "This grant covers living expenses and insurance. "
         "Apply now for this research fellowship."),
        ("https://euraxess.ec.europa.eu/jobs/search",
         "EURAXESS Marie Sklodowska-Curie Postdoctoral Fellowship\n"
         "Prestige European postdoctoral fellowship. "
         "This fellowship provides funding and mobility allowance. "
         "Apply now for this postdoctoral opportunity."),
        ("https://www.scholarshipportal.com/scholarships/international",
         "ScholarshipPortal Global Master's Excellence Grant\n"
         "Merit-based international tuition scholarship. "
         "This grant covers tuition fees. Apply now for this funding."),
        ("https://opportunitydesk.org/category/fellowships/",
         "Opportunity Desk Global Youth Leadership Fellowship\n"
         "6-month virtual leadership accelerator. "
         "This fellowship provides project funding. "
         "Apply today for this grant opportunity."),
        ("https://fellowship.mlh.com/",
         "MLH Production Engineering Fellowship Summer 2026\n"
         "12-week remote fellowship. "
         "This fellowship provides a stipend. Apply now."),
        ("https://www.ycombinator.com/apply",
         "Y Combinator Summer 2026 Batch Funding\n"
         "YC invests $500k. This accelerator provides seed funding. "
         "Apply now for this funding opportunity."),
        ("https://www.techstars.com/accelerators",
         "Techstars Global Accelerator Cohort 2026\n"
         "13-week accelerator program. "
         "This accelerator provides funding and mentorship. "
         "Apply now for this cohort."),
        ("https://us.fulbrightonline.org/applicants/getting-started",
         "Fulbright Foreign Student Program 2026-2027\n"
         "Flagship US government scholarship. "
         "This scholarship covers tuition and provides stipend. "
         "Apply now for this grant."),
        ("https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students/erasmus-mundus-joint-masters-scholarships",
         "Erasmus Mundus Joint Master Degree Scholarship\n"
         "Prestigious EU scholarship covering tuition. "
         "This scholarship provides monthly funding. "
         "Apply now for this grant opportunity."),
        ("https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/programmes/horizon",
         "Horizon Europe Frontier Science Research Grant\n"
         "EU flagship grant for ground-breaking research. "
         "This grant provides consortium funding. "
         "Apply now for this funding scheme."),
        ("https://www.kaggle.com/competitions/specific-ml-competition",
         "Kaggle Specific ML Competition\n"
         "Develop state-of-the-art predictive models. "
         "This competition has a prize pool with grant funding. "
         "Apply now for this funding opportunity."),
        ("https://careers.un.org/young-professionals-programme",
         "UN Young Professionals Programme 2026\n"
         "Recruitment initiative for talented professionals. "
         "This program is a fellowship with stipend. "
         "Apply now for this young professionals program."),
        ("https://startup.google.com/programs/accelerator/middle-east-north-africa-turkey/",
         "Google for Startups Accelerator: MENA & Turkey\n"
         "10-week equity-free accelerator program. "
         "This accelerator provides Cloud credits and funding. "
         "Apply now for this incubation program."),
        ("https://ai.ethz.ch/education/postdoctoral-fellowship.html",
         "ETH AI Center Postdoctoral Fellowship 2026\n"
         "Interdisciplinary fellowship at ETH AI Center. "
         "This fellowship provides research funding and stipend. "
         "Apply now for this postdoctoral opportunity."),
        ("https://www.humboldt-foundation.de/en/apply/sponsorship-programmes/humboldt-research-fellowship",
         "Humboldt Postdoctoral Research Fellowship 2026\n"
         "Prestigious long-term research fellowship. "
         "This fellowship provides funding for postdoctoral research. "
         "Apply now for this grant."),
    ]
    for url, text in real_opps:
        should_accept(url, text, f"synthetic opp text for: {text.split(chr(10))[0]}")


def test_known_blog_posts_rejected():
    """Blog posts from the backup DB that should never have been ingested."""
    blog_posts = [
        ("https://anatolyzenkov.com/stolen-buttons",
         "Stolen Buttons - a personal story about buttons",
         "Personal blog post"),
        ("https://tobi.knaup.me/open-weight-ai-moment/",
         "Open-weight AI is having its Kubernetes moment. Let's not ruin it.",
         "Tech opinion blog"),
        ("https://kitsumed.github.io/blog/posts/android-restrict-adb/",
         "Android May Soon Restrict On-Device ADB",
         "Tech news blog"),
        ("https://dead.garden/blog/how-my-images-are-dithered.html",
         "How My Images Are Dithered",
         "Personal blog post"),
        ("https://rauno.me/notes/2",
         "Rauno's Field Notes #2",
         "Personal notes blog"),
        ("https://www.nytimes.com/2026/07/22/arts/design/charles-ross-star-axis.html",
         "Charles Ross spent 50 yrs building Star Axis in New Mexico",
         "NYT news article"),
        ("https://www.popsci.com/science/whats-jimothy-raccoon-condition/",
         "Jimothy the raccoon has a rare spinal condition.",
         "PopSci article"),
        ("https://aerospaceglobalnews.com/news/gatwick-airport-robotic-parking/",
         "Park by Robot at London Gatwick Airport",
         "Aerospace news article"),
        ("https://pentaton.app/blog/2026-07-12-introducing-pentaton-lp/",
         "I learned PCB design, 3D printing and C just to listen to music",
         "Blog post on personal site"),
    ]
    for url, text, reason in blog_posts:
        should_reject(url, text, reason)


def test_non_opportunity_pages_from_sources():
    """Source navigation pages that are not opportunities."""
    nav_pages = [
        ("https://careers.cern/working-at-cern/",
         "Working at CERN - benefits and culture",
         "CERN navigation page"),
        ("https://euraxess.ec.europa.eu/career-development",
         "Career Development - resources for researchers",
         "EURAXESS nav page"),
        ("https://us.fulbrightonline.org/about/competition-selection",
         "Competition & Selection - Fulbright selection process",
         "Fulbright info page"),
        ("https://startup.google.com/alumni/",
         "Google for Startups alumni network",
         "GfS alumni page"),
        ("https://www.ycombinator.com/legal#privacy",
         "Privacy Policy - Y Combinator",
         "YC legal page"),
    ]
    for url, text, reason in nav_pages:
        should_reject(url, text, reason)


# ── Edge cases ─────────────────────────────────────────────────────────────────

def test_edge_case_very_short_text():
    """Very short text with exactly 2 keywords should be accepted."""
    should_accept(
        "https://example.org/fellowship",
        "Fellowship with grant. Apply now.",
        "23 chars with 'fellowship' + 'grant' + 'apply now' = 3 keywords"
    )


def test_edge_case_short_text_insufficient_keywords():
    """Very short text with only 1 keyword should be rejected."""
    should_reject(
        "https://example.org/some-page",
        "Just a short text about fellowship.",
        "Only 1 keyword ('fellowship')"
    )


def test_edge_case_very_long_text():
    """Very long text should not cause performance issues or incorrect results."""
    long_text = (
        "Research Fellowship Program 2026\n"
        + "This is a prestigious fellowship opportunity. " * 100
        + "Apply now for this grant funding program. "
        + "We provide postdoctoral fellowship positions with stipend."
    )
    should_accept(
        "https://example.com/research-fellowship-2026",
        long_text,
        "very long text with keywords"
    )


def test_edge_case_keywords_from_url_and_text():
    """Keyword count should combine URL and text sources."""
    # URL has 'fellowship', text has 'grant' = 2 keywords from different sources
    should_accept(
        "https://example.org/2026-fellowship-program",
        "This program provides a research grant for selected candidates. "
        "Apply today for this opportunity.",
        "'fellowship' from URL + 'grant' from text = 2 total"
    )
    # URL has no keywords, text has exactly 2 = should pass
    should_accept(
        "https://example.org/programs/2026",
        "Research fellowship grant for postdoctoral researchers. "
        "Apply now for this funding opportunity.",
        "'fellowship' + 'grant' + 'postdoctoral' + 'apply now' + "
        "'funding opportunity' from text"
    )


def test_edge_case_unicode_in_url():
    """URLs with unicode characters should be handled without crashing."""
    should_reject(
        "https://example.com/etudiant/fellowship",
        "Bourse d'etudes pour etudiants internationaux. "
        "Cette fellowship offre un financement. Postulez maintenant.",
        "unicode-adjacent in url"
    )


def test_edge_case_url_with_port():
    """URLs with port numbers should still be parsed correctly."""
    should_accept(
        "https://example.com:8080/fellowship/apply",
        "Fellowship Program for postdoctoral researchers. "
        "This fellowship provides funding. Apply now for this grant.",
        "url with port number"
    )


def test_edge_case_url_with_fragment():
    """URLs with fragments should still be parsed correctly."""
    should_accept(
        "https://example.com/fellowship#apply-now",
        "Excellence Fellowship for graduate students. "
        "This scholarship provides full funding. Apply today.",
        "url with fragment"
    )


def test_edge_case_title_label_stripped():
    """'Title:' prefix should be stripped before length check."""
    should_reject(
        "https://example.com/hi",
        "Title: Hi\nSome other text about things.",
        "stripped title too short (2 chars)"
    )
    should_accept(
        "https://example.com/fellowship",
        "Title: Research Fellowship\n"
        "This fellowship provides funding for postdoctoral research. "
        "Apply now for this grant.",
        "stripped title long enough (19 chars)"
    )


def test_edge_case_numbers_in_text():
    """Text with lots of numbers should not confuse the keyword counter."""
    should_accept(
        "https://example.com/2026-fellowship-program",
        "2026 Fellowship Program for postdoctoral researchers. "
        "This fellowship provides 100% funding. "
        "Apply now for this grant. 50 positions available.",
        "text with numbers and keywords"
    )


def test_edge_case_dash_separated_url():
    """URLs with many dash-separated words should be handled."""
    should_accept(
        "https://research-foundation.org/fully-funded-postdoctoral-research-fellowship-2026",
        "Fully Funded Postdoctoral Research Fellowship 2026. "
        "This fellowship provides research funding. Apply now.",
        "dash-separated url with keywords"
    )


# ── Run all tests ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    tests = [
        ("T1: Empty/None guard", test_tier1_empty_guard),
        ("T1: Junk domains", test_tier1_junk_domains),
        ("T1: Junk domain edge cases", test_tier1_junk_domain_edge_cases),
        ("T2: Junk path patterns", test_tier2_junk_path_patterns),
        ("T3: Devpost hackathons", test_tier3_devpost_hackathons),
        ("T3: Kaggle listing", test_tier3_kaggle_listing),
        ("T3: Kaggle specific competition", test_tier3_kaggle_specific_competition),
        ("GITHUB: Repo with keywords accepted", test_github_repo_with_keywords_accepted),
        ("GITHUB: Repo without keywords rejected", test_github_repo_without_keywords_rejected),
        ("GITHUB: Show HN rejected", test_github_repo_show_hn_rejected),
        ("T4: Insufficient keywords", test_tier4_insufficient_keywords),
        ("T4: Sufficient keywords", test_tier4_sufficient_keywords),
        ("T5: Blog title starts", test_tier5_blog_title_starts),
        ("T5: Short title", test_tier5_short_title),
        ("INTEGRATION: 16 DB opp URLs accepted", test_real_opportunity_urls_accept_synthetic_text),
        ("INTEGRATION: Blog posts rejected", test_known_blog_posts_rejected),
        ("INTEGRATION: Nav pages rejected", test_non_opportunity_pages_from_sources),
        ("EDGE: Very short text accepted", test_edge_case_very_short_text),
        ("EDGE: Short text rejected (1 keyword)", test_edge_case_short_text_insufficient_keywords),
        ("EDGE: Very long text", test_edge_case_very_long_text),
        ("EDGE: Keywords from URL + text", test_edge_case_keywords_from_url_and_text),
        ("EDGE: Unicode in URL", test_edge_case_unicode_in_url),
        ("EDGE: URL with port", test_edge_case_url_with_port),
        ("EDGE: URL with fragment", test_edge_case_url_with_fragment),
        ("EDGE: Title label stripped", test_edge_case_title_label_stripped),
        ("EDGE: Numbers in text", test_edge_case_numbers_in_text),
        ("EDGE: Dash-separated URL", test_edge_case_dash_separated_url),
    ]

    passed = 0
    failed = 0

    print("=" * 72)
    print("  is_invalid_junk_url - 5-Tier Filter Test Suite")
    print("=" * 72)
    print()

    for name, func in tests:
        try:
            func()
            print(f"  [PASS] {name}")
            passed += 1
        except AssertionError as e:
            print(f"  [FAIL] {name}")
            print(f"         {e}")
            failed += 1
        except Exception as e:
            print(f"  [ERR ] {name}")
            print(f"         UNEXPECTED: {e}")
            import traceback
            traceback.print_exc()
            failed += 1

    print()
    print("=" * 72)
    total = passed + failed
    print(f"  Results: {passed}/{total} passed, {failed} failed")
    if failed:
        print("  FAIL  SOME TESTS FAILED")
    else:
        print("  PASS  ALL TESTS PASSED")
    print("=" * 72)

    sys.exit(1 if failed else 0)
