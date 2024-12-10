build-api:
	cd api && docker build -t bingo-api:local -f Containerfile . 

build-web:
	cd web && docker build -t bingo-web:local -f Containerfile . 