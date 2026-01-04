.PHONY: build-prd start-prd

IMAGE_NAME := typing-games

build-prd:
	docker build -t $(IMAGE_NAME) .

start-prd:
	docker run --rm -p 80:80 $(IMAGE_NAME)
