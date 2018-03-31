FROM ubuntu:16.04

RUN apt-get update && apt-get install -y software-properties-common
RUN add-apt-repository ppa:ethereum/ethereum -y

RUN apt-get update && \
        apt-get install -y \
        build-essential \
        solc \
        ethereum

RUN add-apt-repository ppa:jonathonf/python-3.6
RUN apt-get update && apt-get install -y python3.6 python3-pip

WORKDIR /
ADD drequirements.txt .
RUN pip3 install -r drequirements.txt
RUN mkdir workspace
WORKDIR workspace