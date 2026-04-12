import requests
import time
import sys


def ping_url(url, delay, max_trials):
   trials = 0
   while trials < max_trials:
      try:
         response = requests.get(url)
         if response.status_code == 200:
            print(f"Success: {url} is reachable.")
            return True
      except requests.exceptions.RequestException as e:
         print(f"Attempt {trials + 1}: Error pinging {url}: {e}. Retrying in {delay} seconds...")
         trials += 1
         time.sleep(delay)
   
   return False

   
def run():
   website_url = os.getenv("INPUT_URL")
   delay = int(os.getenv("INPUT_DELAY-SECONDS"))
   max_trials = int(os.getenv("INPUT_MAX-TRIALS"))

   website_reachable = ping_url(website_url, delay, max_trials)


if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)