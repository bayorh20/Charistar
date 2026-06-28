import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = {
    'Firebase Client': 'https://orderfoodmaxx.web.app',
    'Vercel Client': 'https://foodmaxx.vercel.app',
    'Vercel Admin': 'https://foodmaxx-admin.vercel.app'
}

for name, url in urls.items():
    print(f"\nFetching {name} from {url}...")
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            status = response.status
            content = response.read().decode('utf-8')
            print(f"Status: {status}, Length: {len(content)} bytes")
            print("First 15 lines of content:")
            lines = content.splitlines()
            for line in lines[:15]:
                print("  ", line)
            print("Last 5 lines of content:")
            for line in lines[-5:]:
                print("  ", line)
    except Exception as e:
        print(f"Error fetching {name}: {e}")
