all: test

pull:
	docker pull biothings/biothings-studio:0.2b

kill:
	-docker kill test_studio
	sleep 5
	while docker ps | grep test_studio; do sleep 1; done

run: kill
	docker run --rm --name test_studio -p 8080:8080 -p 7080:7080 -p 8000:8000 -d biothings/biothings-studio:0.2b

wait:
	while ! curl localhost:7080; do echo waiting for hub api to run; sleep 5; done

test: pull run wait
	HUB_API_HOST=http://localhost:7080 py.test .

