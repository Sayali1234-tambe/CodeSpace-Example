FROM python:alpine3.19
WORKDIR /app
COPY requirements.txt .
RUN python -V
RUN pip install -r requirements.txt
CMD ["python", "/app/main.py"]
COPY . .