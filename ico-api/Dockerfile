FROM ubuntu:16.04

RUN apt-get update && apt-get install -y software-properties-common
RUN add-apt-repository ppa:ethereum/ethereum -y

RUN apt-get update && \
        apt-get install -y \
        build-essential \
        solc

RUN add-apt-repository ppa:jonathonf/python-3.6
RUN apt-get update && apt-get install -y python3.6 python3-pip

WORKDIR /
ADD requirements.txt .
RUN pip3 install -r requirements.txt
RUN mkdir workspace
WORKDIR workspace/ico-api
