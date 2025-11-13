FROM python:3.14-slim
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
COPY data/places.json .
CMD ["python","main.py"]