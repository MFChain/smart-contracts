#!/bin/bash

CHECK=0
INFO_CSV="deploy_info.csv"
BDDI_LOG="bd_deploy_info.log"
OWNERS_OF_MULTISIG="0x145CC078183A8A38d03e39086956fA759505C987,0xf5fA1aAC73e222093218cd14B9d757ba7B853423,0x748D8a3805Be42352C82192359D1096eCdFfb3e4"
ESCROW="0xb36A2bfB9232048Acf5c229BFc118D2c8FdCaDF3"
CSTMR="0x87544f8D45A31a317F197189Ffd5e915D2d46E58"
MLCE_LOG="current_event.txt"

C_PATH=`pwd`
cd $C_PATH/..
M_PATH=`pwd`
cd simulation/

[ ! -d $C_PATH/log/ ] && mkdir $C_PATH/log
echo -e "\n" > $C_PATH/log/$MLCE_LOG && tail -f $C_PATH/log/$MLCE_LOG &

function t_Log(){
	printf "[+] `date` -> $*\n"
}

function e_Calc(){
	echo ""
}

function t_Docker_Compose(){
	ps -aux | grep "docker-compose -f rinkeby-docker-compose.yml up" | grep -v grep > /dev/null
	if [ $? -ne 0 ];then
		docker-compose -f rinkeby-docker-compose.yml up > /tmp/docker_compose.log &
		sleep 10;
	fi
}

function r_Deploy_Contracts(){
	python3 deploy_contracts.py -a $OWNERS_OF_MULTISIG -r 2 -e $ESCROW
	if [ -f "${INFO_CSV}" ];then
		echo -e "\n\t = = = $(date) = = =\n" >> $C_PATH/log/$BDDI_LOG;
		cat ${INFO_CSV} >> $C_PATH/log/$BDDI_LOG;
	else
		CHECK=`expr $CHECK + 1`
		t_Log "File ${INFO_CSV} doesn't exists."
	fi
}

function r_Start_Ico_Stage(){
	ICO_TYPE=$1;
	ICO_TSTART=`python3 ${M_PATH}/user_run/unix_time_generate.py | awk '{print $1}'` #+5
	ICO_TEND=`python3 ${M_PATH}/user_run/unix_time_generate.py | awk '{print $2}'` #+20
	python3 start_ico_stage.py -e $CSTMR -s $ICO_TSTART -d $ICO_TEND -t $ICO_TYPE
	cat $INFO_CSV | tail -1 >> $C_PATH/log/$BDDI_LOG
}

function r_Add_To_Whitelist(){
	ICO_ST=$INFO_CSV | tail -1 | cut -d , -f 2
	if [ -z ${ICO_ST} ];then
		python3 manage.py whitelist -a $ICO_ST
	else
		CHECK=`expr $CHECK + 1`
		t_Log "No line in $INFO_CSV"
	fi
}

if [ -f 'start_ico_stage.py' ];then
	##t_Docker_Compose >> $C_PATH/log/$MLCE_LOG
	r_Deploy_Contracts >> $C_PATH/log/$MLCE_LOG
	r_Start_Ico_Stage private_offer >> $C_PATH/log/$MLCE_LOG
	r_Add_To_Whitelist >> $C_PATH/log/$MLCE_LOG
else
	CHECK=`expr $CHECK + 1`
	t_Log "Check the current directory."
fi

t_Log $CHECK
