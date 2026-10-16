all: api

info:
	df -h
	ps auxgww

api_mvcgi: info
	cd hubapi/mvcgi && make test


api: api_mvcgi

