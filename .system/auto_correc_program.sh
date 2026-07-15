# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    auto_correc_program.sh                             :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jcluzet <jcluzet@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2021/06/20 02:26:11 by jcluzet           #+#    #+#              #
#    Updated: 2022/12/14 15:24:12 by jcluzet          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FILE="../../rendu/$2/$1"

tmp=""
timeout=0

if [ -e .system/grading/traceback ];then
    rm .system/grading/traceback;
fi

cd .system/grading
gcc -o source "$1"
./source "${@:3}" | cat -e > sourcexam       #TESTING
rm -f source
{
gcc -o final "$FILE"
}  2>.dev

# Esegue lo studente con timeout massimo di 10 secondi
timeout 10 ./final "${@:3}" | cat -e > finalexam
EXITCODE=$?

if [ $EXITCODE -eq 124 ]
then
    timeout=1
fi


DIFF=$(diff sourcexam finalexam)
if [ "$DIFF" != "" ]
then
        echo "----------------8<-------------[ START TEST " >> traceback
        printf "        💻 TEST\n./a.out " >> traceback
        for i in "${@:3}"
        do
            printf "\"$i\" " >> traceback
        done
        printf "\n        🔎 YOUR OUTPUT:\n" >> traceback
        cat finalexam >> traceback
        if [ $timeout -eq 1 ]
        then
        printf "   ❌ TIMEOUT\n" >> traceback
		elif [ -e final ]
		then
        printf "        🗝 EXPECTED OUTPUT:\n" >> traceback
		cat sourcexam >> traceback
		else
        printf "\n";
        echo "$(cat .dev)" >> traceback
        rm .dev
		printf "\n        ❌ COMPILATION ERROR\n" >> traceback
		fi
        echo "----------------8<------------- END TEST ]" >> traceback
fi
{
rm -f final finalexam sourcexam .dev
} &>/dev/null
cd ../..