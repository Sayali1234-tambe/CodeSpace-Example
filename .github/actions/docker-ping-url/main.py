import requests
import time
import sys


def ping_url(url, delay, max_trials):
    """
    Ping a URL until maximum trials have been exceeded.
    
    Args:
        url (str): The URL to ping
        delay (int): Delay in seconds between each trial
        max_trials (int): Maximum number of trials to ping the URL
    
    Returns:
        bool: True if URL returns 200, False otherwise
    """
    trials = 0
    while trials < max_trials:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                return True
        except requests.exceptions.RequestException:
            pass
        
        trials += 1
        if trials < max_trials:
            time.sleep(delay)
    
    return False


def run():
    """Retrieve inputs from environment variables and call ping_url."""
    import os
    
    url = os.getenv("INPUT_URL", "")
    delay = int(os.getenv("INPUT_DELAY-SECONDS", "5"))
    max_trials = int(os.getenv("INPUT_MAX-TRIALS", "10"))
    
    if not url:
        raise ValueError("URL is required")
    
    result = ping_url(url, delay, max_trials)
    if not result:
        raise Exception(f"Failed to ping URL {url} after {max_trials} attempts")


if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)