import requests
import time
import sys
import os

def set_output(filepath, key, value):
   with open(filepath, 'a') as file:
      print(f"{key}={value}", file=file)

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
   set_output(os.getenv("GITHUB_OUTPUT"), "url-reachable", website_reachable)
   if not website_reachable:
      raise Exception(f"Failed to ping {website_url} after {max_trials} attempts.")
   print(f"Successfully pinged {website_url}.")


if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)