import urllib.request

url = 'https://foodmaxx-admin.vercel.app'
try:
    with urllib.request.urlopen(url) as response:
        html = response.read().decode('utf-8')
        print(html)
except Exception as e:
    print(f"Error fetching admin html: {e}")
