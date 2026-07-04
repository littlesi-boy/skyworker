const EXAM_BANKS = {
  "dev": [
    {
      "id": "dev-1",
      "sourceId": 1,
      "category": "dev",
      "type": "choice",
      "question": "Python中以下哪个关键字可以定义函数？",
      "options": [
        {
          "key": "A",
          "text": "class"
        },
        {
          "key": "B",
          "text": "def"
        },
        {
          "key": "C",
          "text": "func"
        },
        {
          "key": "D",
          "text": "define"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-2",
      "sourceId": 2,
      "category": "dev",
      "type": "choice",
      "question": "HTTP协议中，用于客户端向服务器提交数据的请求方法是？",
      "options": [
        {
          "key": "A",
          "text": "GET"
        },
        {
          "key": "B",
          "text": "POST"
        },
        {
          "key": "C",
          "text": "DELETE"
        },
        {
          "key": "D",
          "text": "HEAD"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-3",
      "sourceId": 3,
      "category": "dev",
      "type": "choice",
      "question": "MySQL中，用于查询数据表所有数据的关键字是？",
      "options": [
        {
          "key": "A",
          "text": "FIND"
        },
        {
          "key": "B",
          "text": "SELECT"
        },
        {
          "key": "C",
          "text": "SEARCH"
        },
        {
          "key": "D",
          "text": "QUERY"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-4",
      "sourceId": 4,
      "category": "dev",
      "type": "choice",
      "question": "JavaScript中，以下哪个方法可以向控制台输出内容？",
      "options": [
        {
          "key": "A",
          "text": "print()"
        },
        {
          "key": "B",
          "text": "console.log()"
        },
        {
          "key": "C",
          "text": "output()"
        },
        {
          "key": "D",
          "text": "echo()"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-5",
      "sourceId": 5,
      "category": "dev",
      "type": "choice",
      "question": "操作系统中，CPU调度的最小单位是？",
      "options": [
        {
          "key": "A",
          "text": "进程"
        },
        {
          "key": "B",
          "text": "线程"
        },
        {
          "key": "C",
          "text": "程序"
        },
        {
          "key": "D",
          "text": "任务"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-6",
      "sourceId": 6,
      "category": "dev",
      "type": "choice",
      "question": "Python中列表的切片操作list[1:3]，会截取哪两个下标元素？",
      "options": [
        {
          "key": "A",
          "text": "1、2"
        },
        {
          "key": "B",
          "text": "1、3"
        },
        {
          "key": "C",
          "text": "2、3"
        },
        {
          "key": "D",
          "text": "0、1"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-7",
      "sourceId": 7,
      "category": "dev",
      "type": "choice",
      "question": "以下哪个不是前端三大核心技术？",
      "options": [
        {
          "key": "A",
          "text": "HTML"
        },
        {
          "key": "B",
          "text": "CSS"
        },
        {
          "key": "C",
          "text": "JavaScript"
        },
        {
          "key": "D",
          "text": "Java"
        }
      ],
      "answer": "D"
    },
    {
      "id": "dev-8",
      "sourceId": 8,
      "category": "dev",
      "type": "choice",
      "question": "TCP协议的端口号范围是？",
      "options": [
        {
          "key": "A",
          "text": "0-1024"
        },
        {
          "key": "B",
          "text": "0-65535"
        },
        {
          "key": "C",
          "text": "1-65535"
        },
        {
          "key": "D",
          "text": "0-32768"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-9",
      "sourceId": 9,
      "category": "dev",
      "type": "choice",
      "question": "MySQL中主键约束的关键字是？",
      "options": [
        {
          "key": "A",
          "text": "UNIQUE"
        },
        {
          "key": "B",
          "text": "PRIMARY KEY"
        },
        {
          "key": "C",
          "text": "FOREIGN KEY"
        },
        {
          "key": "D",
          "text": "NOT NULL"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-10",
      "sourceId": 10,
      "category": "dev",
      "type": "choice",
      "question": "Python中，以下哪个数据类型是不可变类型？",
      "options": [
        {
          "key": "A",
          "text": "列表list"
        },
        {
          "key": "B",
          "text": "字典dict"
        },
        {
          "key": "C",
          "text": "元组tuple"
        },
        {
          "key": "D",
          "text": "集合set"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-11",
      "sourceId": 11,
      "category": "dev",
      "type": "choice",
      "question": "CSS中，用于设置元素文字颜色的属性是？",
      "options": [
        {
          "key": "A",
          "text": "bg-color"
        },
        {
          "key": "B",
          "text": "color"
        },
        {
          "key": "C",
          "text": "font-color"
        },
        {
          "key": "D",
          "text": "text-color"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-12",
      "sourceId": 12,
      "category": "dev",
      "type": "choice",
      "question": "HTTP状态码200代表的含义是？",
      "options": [
        {
          "key": "A",
          "text": "请求成功"
        },
        {
          "key": "B",
          "text": "页面未找到"
        },
        {
          "key": "C",
          "text": "服务器错误"
        },
        {
          "key": "D",
          "text": "请求重定向"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-13",
      "sourceId": 13,
      "category": "dev",
      "type": "choice",
      "question": "算法中，时间复杂度O(n)代表的是？",
      "options": [
        {
          "key": "A",
          "text": "常数阶"
        },
        {
          "key": "B",
          "text": "线性阶"
        },
        {
          "key": "C",
          "text": "平方阶"
        },
        {
          "key": "D",
          "text": "对数阶"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-14",
      "sourceId": 14,
      "category": "dev",
      "type": "choice",
      "question": "Linux中查看当前目录所有文件的命令是？",
      "options": [
        {
          "key": "A",
          "text": "cd"
        },
        {
          "key": "B",
          "text": "ls"
        },
        {
          "key": "C",
          "text": "pwd"
        },
        {
          "key": "D",
          "text": "mkdir"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-15",
      "sourceId": 15,
      "category": "dev",
      "type": "choice",
      "question": "Python中for循环可以遍历以下哪种结构？",
      "options": [
        {
          "key": "A",
          "text": "整数"
        },
        {
          "key": "B",
          "text": "字符串"
        },
        {
          "key": "C",
          "text": "浮点数"
        },
        {
          "key": "D",
          "text": "布尔值"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-16",
      "sourceId": 16,
      "category": "dev",
      "type": "choice",
      "question": "JavaScript中，声明常量的关键字是？",
      "options": [
        {
          "key": "A",
          "text": "var"
        },
        {
          "key": "B",
          "text": "let"
        },
        {
          "key": "C",
          "text": "const"
        },
        {
          "key": "D",
          "text": "static"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-17",
      "sourceId": 17,
      "category": "dev",
      "type": "choice",
      "question": "以下哪个是关系型数据库？",
      "options": [
        {
          "key": "A",
          "text": "Redis"
        },
        {
          "key": "B",
          "text": "MongoDB"
        },
        {
          "key": "C",
          "text": "MySQL"
        },
        {
          "key": "D",
          "text": "Elasticsearch"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-18",
      "sourceId": 18,
      "category": "dev",
      "type": "choice",
      "question": "TCP协议的主要特点不包括？",
      "options": [
        {
          "key": "A",
          "text": "面向连接"
        },
        {
          "key": "B",
          "text": "可靠传输"
        },
        {
          "key": "C",
          "text": "无连接"
        },
        {
          "key": "D",
          "text": "有序传输"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-19",
      "sourceId": 19,
      "category": "dev",
      "type": "choice",
      "question": "Python中，range(5)生成的数字序列最大值是？",
      "options": [
        {
          "key": "A",
          "text": "5"
        },
        {
          "key": "B",
          "text": "4"
        },
        {
          "key": "C",
          "text": "6"
        },
        {
          "key": "D",
          "text": "0"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-20",
      "sourceId": 20,
      "category": "dev",
      "type": "choice",
      "question": "CSS中，设置元素居中对齐的属性是？",
      "options": [
        {
          "key": "A",
          "text": "text-align:center"
        },
        {
          "key": "B",
          "text": "align:center"
        },
        {
          "key": "C",
          "text": "font-align:center"
        },
        {
          "key": "D",
          "text": "position:center"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-21",
      "sourceId": 21,
      "category": "dev",
      "type": "choice",
      "question": "HTTP状态码404代表？",
      "options": [
        {
          "key": "A",
          "text": "服务器内部错误"
        },
        {
          "key": "B",
          "text": "请求资源不存在"
        },
        {
          "key": "C",
          "text": "请求参数错误"
        },
        {
          "key": "D",
          "text": "权限不足"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-22",
      "sourceId": 22,
      "category": "dev",
      "type": "choice",
      "question": "Linux中切换目录的命令是？",
      "options": [
        {
          "key": "A",
          "text": "pwd"
        },
        {
          "key": "B",
          "text": "cd"
        },
        {
          "key": "C",
          "text": "rm"
        },
        {
          "key": "D",
          "text": "cp"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-23",
      "sourceId": 23,
      "category": "dev",
      "type": "choice",
      "question": "Python中字典通过什么获取对应值？",
      "options": [
        {
          "key": "A",
          "text": "下标"
        },
        {
          "key": "B",
          "text": "键"
        },
        {
          "key": "C",
          "text": "值"
        },
        {
          "key": "D",
          "text": "索引"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-24",
      "sourceId": 24,
      "category": "dev",
      "type": "choice",
      "question": "以下哪种排序算法属于稳定排序？",
      "options": [
        {
          "key": "A",
          "text": "冒泡排序"
        },
        {
          "key": "B",
          "text": "快速排序"
        },
        {
          "key": "C",
          "text": "选择排序"
        },
        {
          "key": "D",
          "text": "堆排序"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-25",
      "sourceId": 25,
      "category": "dev",
      "type": "choice",
      "question": "MySQL中，删除数据表数据的关键字是？",
      "options": [
        {
          "key": "A",
          "text": "DROP"
        },
        {
          "key": "B",
          "text": "DELETE"
        },
        {
          "key": "C",
          "text": "REMOVE"
        },
        {
          "key": "D",
          "text": "CLEAR"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-26",
      "sourceId": 26,
      "category": "dev",
      "type": "choice",
      "question": "JavaScript中，以下哪个可以定义数组？",
      "options": [
        {
          "key": "A",
          "text": "let arr={}"
        },
        {
          "key": "B",
          "text": "let arr=[]"
        },
        {
          "key": "C",
          "text": "let arr=()"
        },
        {
          "key": "D",
          "text": "let arr=<>"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-27",
      "sourceId": 27,
      "category": "dev",
      "type": "choice",
      "question": "UDP协议的特点是？",
      "options": [
        {
          "key": "A",
          "text": "面向连接、可靠"
        },
        {
          "key": "B",
          "text": "无连接、不可靠"
        },
        {
          "key": "C",
          "text": "面向连接、不可靠"
        },
        {
          "key": "D",
          "text": "无连接、可靠"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-28",
      "sourceId": 28,
      "category": "dev",
      "type": "choice",
      "question": "Python中，round(3.1415,2)的结果是？",
      "options": [
        {
          "key": "A",
          "text": "3.14"
        },
        {
          "key": "B",
          "text": "3.15"
        },
        {
          "key": "C",
          "text": "3.13"
        },
        {
          "key": "D",
          "text": "3.10"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-29",
      "sourceId": 29,
      "category": "dev",
      "type": "choice",
      "question": "CSS中，设置元素外边距的属性是？",
      "options": [
        {
          "key": "A",
          "text": "padding"
        },
        {
          "key": "B",
          "text": "margin"
        },
        {
          "key": "C",
          "text": "border"
        },
        {
          "key": "D",
          "text": "spacing"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-30",
      "sourceId": 30,
      "category": "dev",
      "type": "choice",
      "question": "以下哪个不是Python循环语句？",
      "options": [
        {
          "key": "A",
          "text": "for"
        },
        {
          "key": "B",
          "text": "while"
        },
        {
          "key": "C",
          "text": "do-while"
        },
        {
          "key": "D",
          "text": "以上都不是"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-31",
      "sourceId": 31,
      "category": "dev",
      "type": "choice",
      "question": "HTTP协议默认使用的端口是？",
      "options": [
        {
          "key": "A",
          "text": "21"
        },
        {
          "key": "B",
          "text": "22"
        },
        {
          "key": "C",
          "text": "80"
        },
        {
          "key": "D",
          "text": "443"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-32",
      "sourceId": 32,
      "category": "dev",
      "type": "choice",
      "question": "HTTPS协议默认端口是？",
      "options": [
        {
          "key": "A",
          "text": "8080"
        },
        {
          "key": "B",
          "text": "443"
        },
        {
          "key": "C",
          "text": "80"
        },
        {
          "key": "D",
          "text": "3306"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-33",
      "sourceId": 33,
      "category": "dev",
      "type": "choice",
      "question": "MySQL数据库默认端口是？",
      "options": [
        {
          "key": "A",
          "text": "80"
        },
        {
          "key": "B",
          "text": "443"
        },
        {
          "key": "C",
          "text": "3306"
        },
        {
          "key": "D",
          "text": "6379"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-34",
      "sourceId": 34,
      "category": "dev",
      "type": "choice",
      "question": "Redis默认端口是？",
      "options": [
        {
          "key": "A",
          "text": "3306"
        },
        {
          "key": "B",
          "text": "6379"
        },
        {
          "key": "C",
          "text": "8080"
        },
        {
          "key": "D",
          "text": "22"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-35",
      "sourceId": 35,
      "category": "dev",
      "type": "choice",
      "question": "Linux中查看文件内容的命令是？",
      "options": [
        {
          "key": "A",
          "text": "cat"
        },
        {
          "key": "B",
          "text": "mkdir"
        },
        {
          "key": "C",
          "text": "rm"
        },
        {
          "key": "D",
          "text": "mv"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-36",
      "sourceId": 36,
      "category": "dev",
      "type": "choice",
      "question": "Python中，if 0的判断结果是？",
      "options": [
        {
          "key": "A",
          "text": "True"
        },
        {
          "key": "B",
          "text": "False"
        },
        {
          "key": "C",
          "text": "报错"
        },
        {
          "key": "D",
          "text": "无结果"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-37",
      "sourceId": 37,
      "category": "dev",
      "type": "choice",
      "question": "JavaScript中，== 和 === 的区别是？",
      "options": [
        {
          "key": "A",
          "text": "无区别"
        },
        {
          "key": "B",
          "text": "=== 严格匹配类型和值，== 只匹配值"
        },
        {
          "key": "C",
          "text": "== 严格匹配类型和值，=== 只匹配值"
        },
        {
          "key": "D",
          "text": "=== 仅匹配类型"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-38",
      "sourceId": 38,
      "category": "dev",
      "type": "choice",
      "question": "以下哪种数据结构是先进先出？",
      "options": [
        {
          "key": "A",
          "text": "栈"
        },
        {
          "key": "B",
          "text": "队列"
        },
        {
          "key": "C",
          "text": "树"
        },
        {
          "key": "D",
          "text": "图"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-39",
      "sourceId": 39,
      "category": "dev",
      "type": "choice",
      "question": "Python中，append()方法适用于哪种数据结构？",
      "options": [
        {
          "key": "A",
          "text": "元组"
        },
        {
          "key": "B",
          "text": "列表"
        },
        {
          "key": "C",
          "text": "字典"
        },
        {
          "key": "D",
          "text": "字符串"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-40",
      "sourceId": 40,
      "category": "dev",
      "type": "choice",
      "question": "CSS中padding属性代表？",
      "options": [
        {
          "key": "A",
          "text": "外边距"
        },
        {
          "key": "B",
          "text": "内边距"
        },
        {
          "key": "C",
          "text": "边框"
        },
        {
          "key": "D",
          "text": "宽高"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-41",
      "sourceId": 41,
      "category": "dev",
      "type": "choice",
      "question": "HTTP状态码500代表？",
      "options": [
        {
          "key": "A",
          "text": "请求成功"
        },
        {
          "key": "B",
          "text": "客户端错误"
        },
        {
          "key": "C",
          "text": "服务器内部错误"
        },
        {
          "key": "D",
          "text": "重定向"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-42",
      "sourceId": 42,
      "category": "dev",
      "type": "choice",
      "question": "Linux中创建文件夹的命令是？",
      "options": [
        {
          "key": "A",
          "text": "touch"
        },
        {
          "key": "B",
          "text": "mkdir"
        },
        {
          "key": "C",
          "text": "create"
        },
        {
          "key": "D",
          "text": "new"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-43",
      "sourceId": 43,
      "category": "dev",
      "type": "choice",
      "question": "Python中，len()函数的作用是？",
      "options": [
        {
          "key": "A",
          "text": "求和"
        },
        {
          "key": "B",
          "text": "获取长度"
        },
        {
          "key": "C",
          "text": "排序"
        },
        {
          "key": "D",
          "text": "取最大值"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-44",
      "sourceId": 44,
      "category": "dev",
      "type": "choice",
      "question": "以下哪个是前端JS的循环语句？",
      "options": [
        {
          "key": "A",
          "text": "loop"
        },
        {
          "key": "B",
          "text": "for"
        },
        {
          "key": "C",
          "text": "repeat"
        },
        {
          "key": "D",
          "text": "cycle"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-45",
      "sourceId": 45,
      "category": "dev",
      "type": "choice",
      "question": "MySQL中，修改表结构的关键字是？",
      "options": [
        {
          "key": "A",
          "text": "ALTER"
        },
        {
          "key": "B",
          "text": "UPDATE"
        },
        {
          "key": "C",
          "text": "MODIFY"
        },
        {
          "key": "D",
          "text": "CHANGE"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-46",
      "sourceId": 46,
      "category": "dev",
      "type": "choice",
      "question": "栈的特点是？",
      "options": [
        {
          "key": "A",
          "text": "先进先出"
        },
        {
          "key": "B",
          "text": "后进先出"
        },
        {
          "key": "C",
          "text": "随机存取"
        },
        {
          "key": "D",
          "text": "有序输出"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-47",
      "sourceId": 47,
      "category": "dev",
      "type": "choice",
      "question": "Python中，break语句的作用是？",
      "options": [
        {
          "key": "A",
          "text": "跳过本次循环"
        },
        {
          "key": "B",
          "text": "终止整个循环"
        },
        {
          "key": "C",
          "text": "暂停循环"
        },
        {
          "key": "D",
          "text": "重启循环"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-48",
      "sourceId": 48,
      "category": "dev",
      "type": "choice",
      "question": "Python中，continue语句的作用是？",
      "options": [
        {
          "key": "A",
          "text": "终止循环"
        },
        {
          "key": "B",
          "text": "跳过本次循环，执行下一次"
        },
        {
          "key": "C",
          "text": "退出程序"
        },
        {
          "key": "D",
          "text": "暂停程序"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-49",
      "sourceId": 49,
      "category": "dev",
      "type": "choice",
      "question": "HTML中，段落标签是？",
      "options": [
        {
          "key": "A",
          "text": "<div>"
        },
        {
          "key": "B",
          "text": "<p>"
        },
        {
          "key": "C",
          "text": "<span>"
        },
        {
          "key": "D",
          "text": "<h1>"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-50",
      "sourceId": 50,
      "category": "dev",
      "type": "choice",
      "question": "HTML中，超链接标签是？",
      "options": [
        {
          "key": "A",
          "text": "<link>"
        },
        {
          "key": "B",
          "text": "<a>"
        },
        {
          "key": "C",
          "text": "<url>"
        },
        {
          "key": "D",
          "text": "<href>"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-51",
      "sourceId": 51,
      "category": "dev",
      "type": "choice",
      "question": "计算机网络中，IP地址分为IPv4和IPv6，IPv4的位数是？",
      "options": [
        {
          "key": "A",
          "text": "32位"
        },
        {
          "key": "B",
          "text": "64位"
        },
        {
          "key": "C",
          "text": "128位"
        },
        {
          "key": "D",
          "text": "16位"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-52",
      "sourceId": 52,
      "category": "dev",
      "type": "choice",
      "question": "IPv6的地址位数是？",
      "options": [
        {
          "key": "A",
          "text": "32位"
        },
        {
          "key": "B",
          "text": "64位"
        },
        {
          "key": "C",
          "text": "128位"
        },
        {
          "key": "D",
          "text": "256位"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-53",
      "sourceId": 53,
      "category": "dev",
      "type": "choice",
      "question": "Python中，定义空列表正确的是？",
      "options": [
        {
          "key": "A",
          "text": "list={}"
        },
        {
          "key": "B",
          "text": "list=[]"
        },
        {
          "key": "C",
          "text": "list=()"
        },
        {
          "key": "D",
          "text": "list=\"\""
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-54",
      "sourceId": 54,
      "category": "dev",
      "type": "choice",
      "question": "Python中，定义空字典正确的是？",
      "options": [
        {
          "key": "A",
          "text": "dict=[]"
        },
        {
          "key": "B",
          "text": "dict={}"
        },
        {
          "key": "C",
          "text": "dict=()"
        },
        {
          "key": "D",
          "text": "dict=null"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-55",
      "sourceId": 55,
      "category": "dev",
      "type": "choice",
      "question": "CSS中，设置字体大小的属性是？",
      "options": [
        {
          "key": "A",
          "text": "font-size"
        },
        {
          "key": "B",
          "text": "text-size"
        },
        {
          "key": "C",
          "text": "font-height"
        },
        {
          "key": "D",
          "text": "text-height"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-56",
      "sourceId": 56,
      "category": "dev",
      "type": "choice",
      "question": "JavaScript中，将字符串转为数字的方法是？",
      "options": [
        {
          "key": "A",
          "text": "parseInt()"
        },
        {
          "key": "B",
          "text": "toString()"
        },
        {
          "key": "C",
          "text": "stringify()"
        },
        {
          "key": "D",
          "text": "toNumber()"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-57",
      "sourceId": 57,
      "category": "dev",
      "type": "choice",
      "question": "MySQL中，UPDATE语句的作用是？",
      "options": [
        {
          "key": "A",
          "text": "查询数据"
        },
        {
          "key": "B",
          "text": "修改数据"
        },
        {
          "key": "C",
          "text": "删除数据"
        },
        {
          "key": "D",
          "text": "新增数据"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-58",
      "sourceId": 58,
      "category": "dev",
      "type": "choice",
      "question": "MySQL中，INSERT语句的作用是？",
      "options": [
        {
          "key": "A",
          "text": "新增数据"
        },
        {
          "key": "B",
          "text": "修改数据"
        },
        {
          "key": "C",
          "text": "删除数据"
        },
        {
          "key": "D",
          "text": "排序数据"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-59",
      "sourceId": 59,
      "category": "dev",
      "type": "choice",
      "question": "以下哪个算法是查找算法？",
      "options": [
        {
          "key": "A",
          "text": "冒泡排序"
        },
        {
          "key": "B",
          "text": "二分查找"
        },
        {
          "key": "C",
          "text": "快速排序"
        },
        {
          "key": "D",
          "text": "归并排序"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-60",
      "sourceId": 60,
      "category": "dev",
      "type": "choice",
      "question": "二分查找的前提是？",
      "options": [
        {
          "key": "A",
          "text": "数据无序"
        },
        {
          "key": "B",
          "text": "数据有序"
        },
        {
          "key": "C",
          "text": "数据量小"
        },
        {
          "key": "D",
          "text": "数据唯一"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-61",
      "sourceId": 61,
      "category": "dev",
      "type": "choice",
      "question": "Linux中删除文件的命令是？",
      "options": [
        {
          "key": "A",
          "text": "del"
        },
        {
          "key": "B",
          "text": "rm"
        },
        {
          "key": "C",
          "text": "clear"
        },
        {
          "key": "D",
          "text": "remove"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-62",
      "sourceId": 62,
      "category": "dev",
      "type": "choice",
      "question": "Python中，print(2**3)的输出结果是？",
      "options": [
        {
          "key": "A",
          "text": "5"
        },
        {
          "key": "B",
          "text": "6"
        },
        {
          "key": "C",
          "text": "8"
        },
        {
          "key": "D",
          "text": "9"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-63",
      "sourceId": 63,
      "category": "dev",
      "type": "choice",
      "question": "Python中，print(9%2)的输出结果是？",
      "options": [
        {
          "key": "A",
          "text": "4"
        },
        {
          "key": "B",
          "text": "1"
        },
        {
          "key": "C",
          "text": "0"
        },
        {
          "key": "D",
          "text": "2"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-64",
      "sourceId": 64,
      "category": "dev",
      "type": "choice",
      "question": "前端中，DOM的全称是？",
      "options": [
        {
          "key": "A",
          "text": "Document Object Model"
        },
        {
          "key": "B",
          "text": "Data Object Model"
        },
        {
          "key": "C",
          "text": "Document Online Model"
        },
        {
          "key": "D",
          "text": "Data Online Model"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-65",
      "sourceId": 65,
      "category": "dev",
      "type": "choice",
      "question": "以下哪个不属于HTTP请求头字段？",
      "options": [
        {
          "key": "A",
          "text": "User-Agent"
        },
        {
          "key": "B",
          "text": "Content-Type"
        },
        {
          "key": "C",
          "text": "Status"
        },
        {
          "key": "D",
          "text": "Cookie"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-66",
      "sourceId": 66,
      "category": "dev",
      "type": "choice",
      "question": "Python中，sorted()函数的作用是？",
      "options": [
        {
          "key": "A",
          "text": "反转序列"
        },
        {
          "key": "B",
          "text": "排序序列"
        },
        {
          "key": "C",
          "text": "去重序列"
        },
        {
          "key": "D",
          "text": "拼接序列"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-67",
      "sourceId": 67,
      "category": "dev",
      "type": "choice",
      "question": "集合set的主要特性是？",
      "options": [
        {
          "key": "A",
          "text": "有序可重复"
        },
        {
          "key": "B",
          "text": "无序不可重复"
        },
        {
          "key": "C",
          "text": "有序不可重复"
        },
        {
          "key": "D",
          "text": "无序可重复"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-68",
      "sourceId": 68,
      "category": "dev",
      "type": "choice",
      "question": "CSS中，display:none的作用是？",
      "options": [
        {
          "key": "A",
          "text": "隐藏元素，保留位置"
        },
        {
          "key": "B",
          "text": "隐藏元素，不保留位置"
        },
        {
          "key": "C",
          "text": "显示元素"
        },
        {
          "key": "D",
          "text": "透明元素"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-69",
      "sourceId": 69,
      "category": "dev",
      "type": "choice",
      "question": "CSS中，visibility:hidden的作用是？",
      "options": [
        {
          "key": "A",
          "text": "隐藏元素，保留位置"
        },
        {
          "key": "B",
          "text": "隐藏元素，不保留位置"
        },
        {
          "key": "C",
          "text": "删除元素"
        },
        {
          "key": "D",
          "text": "透明无效果"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-70",
      "sourceId": 70,
      "category": "dev",
      "type": "choice",
      "question": "JavaScript中，typeof null的返回值是？",
      "options": [
        {
          "key": "A",
          "text": "null"
        },
        {
          "key": "B",
          "text": "undefined"
        },
        {
          "key": "C",
          "text": "object"
        },
        {
          "key": "D",
          "text": "number"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-71",
      "sourceId": 71,
      "category": "dev",
      "type": "choice",
      "question": "计算机中，1GB等于多少MB？",
      "options": [
        {
          "key": "A",
          "text": "1000"
        },
        {
          "key": "B",
          "text": "1024"
        },
        {
          "key": "C",
          "text": "512"
        },
        {
          "key": "D",
          "text": "2048"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-72",
      "sourceId": 72,
      "category": "dev",
      "type": "choice",
      "question": "以下哪个是Python的注释符号？",
      "options": [
        {
          "key": "A",
          "text": "//"
        },
        {
          "key": "B",
          "text": "#"
        },
        {
          "key": "C",
          "text": "/* */"
        },
        {
          "key": "D",
          "text": "--"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-73",
      "sourceId": 73,
      "category": "dev",
      "type": "choice",
      "question": "JavaScript单行注释符号是？",
      "options": [
        {
          "key": "A",
          "text": "#"
        },
        {
          "key": "B",
          "text": "//"
        },
        {
          "key": "C",
          "text": "/**/"
        },
        {
          "key": "D",
          "text": "--"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-74",
      "sourceId": 74,
      "category": "dev",
      "type": "choice",
      "question": "MySQL中，设置字段唯一约束的关键字是？",
      "options": [
        {
          "key": "A",
          "text": "NOT NULL"
        },
        {
          "key": "B",
          "text": "UNIQUE"
        },
        {
          "key": "C",
          "text": "PRIMARY"
        },
        {
          "key": "D",
          "text": "DEFAULT"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-75",
      "sourceId": 75,
      "category": "dev",
      "type": "choice",
      "question": "Python中，zip()函数的作用是？",
      "options": [
        {
          "key": "A",
          "text": "压缩文件"
        },
        {
          "key": "B",
          "text": "打包多个序列"
        },
        {
          "key": "C",
          "text": "解压序列"
        },
        {
          "key": "D",
          "text": "排序序列"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-76",
      "sourceId": 76,
      "category": "dev",
      "type": "choice",
      "question": "HTTP请求中，Cookie的主要作用是？",
      "options": [
        {
          "key": "A",
          "text": "加速请求"
        },
        {
          "key": "B",
          "text": "存储用户会话信息"
        },
        {
          "key": "C",
          "text": "加密数据"
        },
        {
          "key": "D",
          "text": "校验参数"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-77",
      "sourceId": 77,
      "category": "dev",
      "type": "choice",
      "question": "以下哪种缓存属于浏览器端缓存？",
      "options": [
        {
          "key": "A",
          "text": "Redis"
        },
        {
          "key": "B",
          "text": "LocalStorage"
        },
        {
          "key": "C",
          "text": "MySQL缓存"
        },
        {
          "key": "D",
          "text": "服务器缓存"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-78",
      "sourceId": 78,
      "category": "dev",
      "type": "choice",
      "question": "Python中，try-except的作用是？",
      "options": [
        {
          "key": "A",
          "text": "循环遍历"
        },
        {
          "key": "B",
          "text": "异常捕获处理"
        },
        {
          "key": "C",
          "text": "条件判断"
        },
        {
          "key": "D",
          "text": "函数定义"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-79",
      "sourceId": 79,
      "category": "dev",
      "type": "choice",
      "question": "算法时间复杂度最低的是？",
      "options": [
        {
          "key": "A",
          "text": "O(1)"
        },
        {
          "key": "B",
          "text": "O(n)"
        },
        {
          "key": "C",
          "text": "O(n²)"
        },
        {
          "key": "D",
          "text": "O(logn)"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-80",
      "sourceId": 80,
      "category": "dev",
      "type": "choice",
      "question": "Linux中查看当前工作目录的命令是？",
      "options": [
        {
          "key": "A",
          "text": "ls"
        },
        {
          "key": "B",
          "text": "cd"
        },
        {
          "key": "C",
          "text": "pwd"
        },
        {
          "key": "D",
          "text": "mkdir"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-81",
      "sourceId": 81,
      "category": "dev",
      "type": "choice",
      "question": "HTML中，换行标签是？",
      "options": [
        {
          "key": "A",
          "text": "<br>"
        },
        {
          "key": "B",
          "text": "<hr>"
        },
        {
          "key": "C",
          "text": "<line>"
        },
        {
          "key": "D",
          "text": "<new>"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-82",
      "sourceId": 82,
      "category": "dev",
      "type": "choice",
      "question": "Python中，str.strip()方法的作用是？",
      "options": [
        {
          "key": "A",
          "text": "分割字符串"
        },
        {
          "key": "B",
          "text": "去除首尾空格"
        },
        {
          "key": "C",
          "text": "替换字符"
        },
        {
          "key": "D",
          "text": "拼接字符串"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-83",
      "sourceId": 83,
      "category": "dev",
      "type": "choice",
      "question": "JavaScript中，alert()的作用是？",
      "options": [
        {
          "key": "A",
          "text": "控制台输出"
        },
        {
          "key": "B",
          "text": "弹出提示框"
        },
        {
          "key": "C",
          "text": "确认弹窗"
        },
        {
          "key": "D",
          "text": "输入弹窗"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-84",
      "sourceId": 84,
      "category": "dev",
      "type": "choice",
      "question": "MySQL中，ORDER BY的作用是？",
      "options": [
        {
          "key": "A",
          "text": "分组"
        },
        {
          "key": "B",
          "text": "排序"
        },
        {
          "key": "C",
          "text": "筛选"
        },
        {
          "key": "D",
          "text": "关联查询"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-85",
      "sourceId": 85,
      "category": "dev",
      "type": "choice",
      "question": "MySQL中，GROUP BY的作用是？",
      "options": [
        {
          "key": "A",
          "text": "数据排序"
        },
        {
          "key": "B",
          "text": "数据分组"
        },
        {
          "key": "C",
          "text": "数据去重"
        },
        {
          "key": "D",
          "text": "数据筛选"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-86",
      "sourceId": 86,
      "category": "dev",
      "type": "choice",
      "question": "栈和队列的共同特点是？",
      "options": [
        {
          "key": "A",
          "text": "都是线性结构"
        },
        {
          "key": "B",
          "text": "都是非线性结构"
        },
        {
          "key": "C",
          "text": "可随机存取"
        },
        {
          "key": "D",
          "text": "无固定规则"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-87",
      "sourceId": 87,
      "category": "dev",
      "type": "choice",
      "question": "Python中，lambda的作用是？",
      "options": [
        {
          "key": "A",
          "text": "定义普通函数"
        },
        {
          "key": "B",
          "text": "定义匿名函数"
        },
        {
          "key": "C",
          "text": "定义类"
        },
        {
          "key": "D",
          "text": "定义变量"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-88",
      "sourceId": 88,
      "category": "dev",
      "type": "choice",
      "question": "前端中，CSS的全称是？",
      "options": [
        {
          "key": "A",
          "text": "Cascading Style Sheets"
        },
        {
          "key": "B",
          "text": "Computer Style Sheets"
        },
        {
          "key": "C",
          "text": "Creative Style Sheets"
        },
        {
          "key": "D",
          "text": "Code Style Sheets"
        }
      ],
      "answer": "A"
    },
    {
      "id": "dev-89",
      "sourceId": 89,
      "category": "dev",
      "type": "choice",
      "question": "HTTP协议属于OSI七层模型的哪一层？",
      "options": [
        {
          "key": "A",
          "text": "网络层"
        },
        {
          "key": "B",
          "text": "传输层"
        },
        {
          "key": "C",
          "text": "应用层"
        },
        {
          "key": "D",
          "text": "数据链路层"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-90",
      "sourceId": 90,
      "category": "dev",
      "type": "choice",
      "question": "TCP/UDP协议属于OSI模型的？",
      "options": [
        {
          "key": "A",
          "text": "应用层"
        },
        {
          "key": "B",
          "text": "传输层"
        },
        {
          "key": "C",
          "text": "网络层"
        },
        {
          "key": "D",
          "text": "物理层"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-91",
      "sourceId": 91,
      "category": "dev",
      "type": "choice",
      "question": "Python中，max()函数的作用是？",
      "options": [
        {
          "key": "A",
          "text": "求和"
        },
        {
          "key": "B",
          "text": "取最大值"
        },
        {
          "key": "C",
          "text": "取最小值"
        },
        {
          "key": "D",
          "text": "取平均值"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-92",
      "sourceId": 92,
      "category": "dev",
      "type": "choice",
      "question": "Python中，min()函数的作用是？",
      "options": [
        {
          "key": "A",
          "text": "取最大值"
        },
        {
          "key": "B",
          "text": "取最小值"
        },
        {
          "key": "C",
          "text": "四舍五入"
        },
        {
          "key": "D",
          "text": "取余数"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-93",
      "sourceId": 93,
      "category": "dev",
      "type": "choice",
      "question": "以下哪个不是Python保留字？",
      "options": [
        {
          "key": "A",
          "text": "if"
        },
        {
          "key": "B",
          "text": "else"
        },
        {
          "key": "C",
          "text": "test"
        },
        {
          "key": "D",
          "text": "for"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-94",
      "sourceId": 94,
      "category": "dev",
      "type": "choice",
      "question": "JavaScript中，undefined代表？",
      "options": [
        {
          "key": "A",
          "text": "空值"
        },
        {
          "key": "B",
          "text": "未定义变量"
        },
        {
          "key": "C",
          "text": "0值"
        },
        {
          "key": "D",
          "text": "空对象"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-95",
      "sourceId": 95,
      "category": "dev",
      "type": "choice",
      "question": "MySQL中，DISTINCT的作用是？",
      "options": [
        {
          "key": "A",
          "text": "排序"
        },
        {
          "key": "B",
          "text": "分组"
        },
        {
          "key": "C",
          "text": "去重"
        },
        {
          "key": "D",
          "text": "筛选"
        }
      ],
      "answer": "C"
    },
    {
      "id": "dev-96",
      "sourceId": 96,
      "category": "dev",
      "type": "choice",
      "question": "Linux中复制文件的命令是？",
      "options": [
        {
          "key": "A",
          "text": "mv"
        },
        {
          "key": "B",
          "text": "cp"
        },
        {
          "key": "C",
          "text": "rm"
        },
        {
          "key": "D",
          "text": "touch"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-97",
      "sourceId": 97,
      "category": "dev",
      "type": "choice",
      "question": "Linux中移动/重命名文件的命令是？",
      "options": [
        {
          "key": "A",
          "text": "cp"
        },
        {
          "key": "B",
          "text": "mv"
        },
        {
          "key": "C",
          "text": "rm"
        },
        {
          "key": "D",
          "text": "cat"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-98",
      "sourceId": 98,
      "category": "dev",
      "type": "choice",
      "question": "Python中，list.pop()默认删除哪个元素？",
      "options": [
        {
          "key": "A",
          "text": "第一个"
        },
        {
          "key": "B",
          "text": "最后一个"
        },
        {
          "key": "C",
          "text": "中间元素"
        },
        {
          "key": "D",
          "text": "随机元素"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-99",
      "sourceId": 99,
      "category": "dev",
      "type": "choice",
      "question": "二叉树的每个节点最多有几个子节点？",
      "options": [
        {
          "key": "A",
          "text": "1个"
        },
        {
          "key": "B",
          "text": "2个"
        },
        {
          "key": "C",
          "text": "3个"
        },
        {
          "key": "D",
          "text": "无数个"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-100",
      "sourceId": 100,
      "category": "dev",
      "type": "choice",
      "question": "前端Vue属于什么类型的框架？",
      "options": [
        {
          "key": "A",
          "text": "后端框架"
        },
        {
          "key": "B",
          "text": "前端渐进式框架"
        },
        {
          "key": "C",
          "text": "数据库框架"
        },
        {
          "key": "D",
          "text": "运维框架"
        }
      ],
      "answer": "B"
    },
    {
      "id": "dev-101",
      "sourceId": 101,
      "category": "dev",
      "type": "blank",
      "question": "Python中，用来获取字符串长度的函数是______。",
      "options": [],
      "answer": "len()"
    },
    {
      "id": "dev-102",
      "sourceId": 102,
      "category": "dev",
      "type": "blank",
      "question": "HTTP协议中，403状态码代表______。",
      "options": [],
      "answer": "权限不足"
    },
    {
      "id": "dev-103",
      "sourceId": 103,
      "category": "dev",
      "type": "blank",
      "question": "MySQL中，查询语句中条件筛选的关键字是______。",
      "options": [],
      "answer": "WHERE"
    },
    {
      "id": "dev-104",
      "sourceId": 104,
      "category": "dev",
      "type": "blank",
      "question": "Python中，定义类的关键字是______。",
      "options": [],
      "answer": "class"
    },
    {
      "id": "dev-105",
      "sourceId": 105,
      "category": "dev",
      "type": "blank",
      "question": "CSS中，设置元素绝对定位的属性值是position:______。",
      "options": [],
      "answer": "absolute"
    },
    {
      "id": "dev-106",
      "sourceId": 106,
      "category": "dev",
      "type": "blank",
      "question": "数据结构中，队列的核心特点是______。（四字中文）",
      "options": [],
      "answer": "先进先出"
    },
    {
      "id": "dev-107",
      "sourceId": 107,
      "category": "dev",
      "type": "blank",
      "question": "Python中，跳出循环的两个关键字是break和______。",
      "options": [],
      "answer": "continue"
    },
    {
      "id": "dev-108",
      "sourceId": 108,
      "category": "dev",
      "type": "blank",
      "question": "HTTPS是在HTTP基础上加入了______加密协议。",
      "options": [],
      "answer": "SSL/TLS"
    },
    {
      "id": "dev-109",
      "sourceId": 109,
      "category": "dev",
      "type": "blank",
      "question": "Linux中，清空终端屏幕的命令是______。",
      "options": [],
      "answer": "clear"
    },
    {
      "id": "dev-110",
      "sourceId": 110,
      "category": "dev",
      "type": "blank",
      "question": "JavaScript中，定义变量的三个关键字是var、let、______。",
      "options": [],
      "answer": "const"
    },
    {
      "id": "dev-111",
      "sourceId": 111,
      "category": "dev",
      "type": "blank",
      "question": "计算机中，二进制101对应的十进制数字是______。",
      "options": [],
      "answer": "5"
    },
    {
      "id": "dev-112",
      "sourceId": 112,
      "category": "dev",
      "type": "blank",
      "question": "Python中，将列表反转的方法是______。",
      "options": [],
      "answer": "reverse()"
    },
    {
      "id": "dev-113",
      "sourceId": 113,
      "category": "dev",
      "type": "blank",
      "question": "MySQL中，用于统计数据条数的聚合函数是______。",
      "options": [],
      "answer": "COUNT()"
    },
    {
      "id": "dev-114",
      "sourceId": 114,
      "category": "dev",
      "type": "blank",
      "question": "栈的核心特点是______。（四字中文）",
      "options": [],
      "answer": "后进先出"
    },
    {
      "id": "dev-115",
      "sourceId": 115,
      "category": "dev",
      "type": "blank",
      "question": "HTTP请求中，______方法用于获取资源，无请求体。",
      "options": [],
      "answer": "GET"
    },
    {
      "id": "dev-116",
      "sourceId": 116,
      "category": "dev",
      "type": "blank",
      "question": "Python中，______数据类型无序、元素不可重复。",
      "options": [],
      "answer": "集合（set）"
    },
    {
      "id": "dev-117",
      "sourceId": 117,
      "category": "dev",
      "type": "blank",
      "question": "CSS中，设置相对定位的属性值是position:______。",
      "options": [],
      "answer": "relative"
    },
    {
      "id": "dev-118",
      "sourceId": 118,
      "category": "dev",
      "type": "blank",
      "question": "IPv4地址由______位二进制数组成。",
      "options": [],
      "answer": "32"
    },
    {
      "id": "dev-119",
      "sourceId": 119,
      "category": "dev",
      "type": "blank",
      "question": "Python中，#符号的作用是______。",
      "options": [],
      "answer": "单行注释"
    },
    {
      "id": "dev-120",
      "sourceId": 120,
      "category": "dev",
      "type": "blank",
      "question": "JavaScript中，将数字转为字符串的方法是______。",
      "options": [],
      "answer": "toString()"
    },
    {
      "id": "dev-121",
      "sourceId": 121,
      "category": "dev",
      "type": "blank",
      "question": "MySQL中，删除数据表结构的关键字是______。",
      "options": [],
      "answer": "DROP"
    },
    {
      "id": "dev-122",
      "sourceId": 122,
      "category": "dev",
      "type": "blank",
      "question": "二分查找的时间复杂度是______。",
      "options": [],
      "answer": "O(logn)"
    },
    {
      "id": "dev-123",
      "sourceId": 123,
      "category": "dev",
      "type": "blank",
      "question": "Python中，range(1,10,2)生成的序列步长是______。",
      "options": [],
      "answer": "2"
    },
    {
      "id": "dev-124",
      "sourceId": 124,
      "category": "dev",
      "type": "blank",
      "question": "前端HTML中，最大的标题标签是______。",
      "options": [],
      "answer": "<h1>"
    },
    {
      "id": "dev-125",
      "sourceId": 125,
      "category": "dev",
      "type": "blank",
      "question": "TCP协议是______连接协议，可靠传输。",
      "options": [],
      "answer": "面向"
    },
    {
      "id": "dev-126",
      "sourceId": 126,
      "category": "dev",
      "type": "blank",
      "question": "UDP协议是______连接协议，传输速度快。",
      "options": [],
      "answer": "无"
    },
    {
      "id": "dev-127",
      "sourceId": 127,
      "category": "dev",
      "type": "blank",
      "question": "Python中，字典获取所有键的方法是______。",
      "options": [],
      "answer": "keys()"
    },
    {
      "id": "dev-128",
      "sourceId": 128,
      "category": "dev",
      "type": "blank",
      "question": "CSS中，设置元素透明的属性是______。",
      "options": [],
      "answer": "opacity"
    },
    {
      "id": "dev-129",
      "sourceId": 129,
      "category": "dev",
      "type": "blank",
      "question": "计算机存储中，1TB=______GB。",
      "options": [],
      "answer": "1024"
    },
    {
      "id": "dev-130",
      "sourceId": 130,
      "category": "dev",
      "type": "blank",
      "question": "Python中，捕获异常的关键字组合是try和______。",
      "options": [],
      "answer": "except"
    },
    {
      "id": "dev-131",
      "sourceId": 131,
      "category": "dev",
      "type": "blank",
      "question": "HTTP状态码302代表______。（两字中文）",
      "options": [],
      "answer": "重定向"
    },
    {
      "id": "dev-132",
      "sourceId": 132,
      "category": "dev",
      "type": "blank",
      "question": "MySQL中，求和的聚合函数是______。",
      "options": [],
      "answer": "SUM()"
    },
    {
      "id": "dev-133",
      "sourceId": 133,
      "category": "dev",
      "type": "blank",
      "question": "MySQL中，求平均值的聚合函数是______。",
      "options": [],
      "answer": "AVG()"
    },
    {
      "id": "dev-134",
      "sourceId": 134,
      "category": "dev",
      "type": "blank",
      "question": "Python中，拼接字符串可以使用______符号。",
      "options": [],
      "answer": "+"
    },
    {
      "id": "dev-135",
      "sourceId": 135,
      "category": "dev",
      "type": "blank",
      "question": "数据结构二叉树，每个节点最多有______个子节点。",
      "options": [],
      "answer": "2"
    },
    {
      "id": "dev-136",
      "sourceId": 136,
      "category": "dev",
      "type": "blank",
      "question": "Linux中，查看文件末尾内容的命令是______。",
      "options": [],
      "answer": "tail"
    },
    {
      "id": "dev-137",
      "sourceId": 137,
      "category": "dev",
      "type": "blank",
      "question": "JavaScript中，弹出确认对话框的方法是______。",
      "options": [],
      "answer": "confirm()"
    },
    {
      "id": "dev-138",
      "sourceId": 138,
      "category": "dev",
      "type": "blank",
      "question": "Python中，去除字符串首尾指定字符的方法是______。",
      "options": [],
      "answer": "strip()"
    },
    {
      "id": "dev-139",
      "sourceId": 139,
      "category": "dev",
      "type": "blank",
      "question": "前端中，JS操作页面文档对象的模型简称是______。",
      "options": [],
      "answer": "DOM"
    },
    {
      "id": "dev-140",
      "sourceId": 140,
      "category": "dev",
      "type": "blank",
      "question": "MySQL中，设置字段非空约束的关键字是______。",
      "options": [],
      "answer": "NOT"
    },
    {
      "id": "dev-141",
      "sourceId": 141,
      "category": "dev",
      "type": "blank",
      "question": "Python中，生成随机数需要导入______模块。",
      "options": [],
      "answer": "random"
    },
    {
      "id": "dev-142",
      "sourceId": 142,
      "category": "dev",
      "type": "blank",
      "question": "冒泡排序的最坏时间复杂度是______。",
      "options": [],
      "answer": "O(n²)"
    },
    {
      "id": "dev-143",
      "sourceId": 143,
      "category": "dev",
      "type": "blank",
      "question": "HTTP默认端口号是80，HTTPS默认端口是______。",
      "options": [],
      "answer": "443"
    },
    {
      "id": "dev-144",
      "sourceId": 144,
      "category": "dev",
      "type": "blank",
      "question": "MySQL默认端口号是______。",
      "options": [],
      "answer": "3306"
    },
    {
      "id": "dev-145",
      "sourceId": 145,
      "category": "dev",
      "type": "blank",
      "question": "Redis默认端口号是______。",
      "options": [],
      "answer": "6379"
    },
    {
      "id": "dev-146",
      "sourceId": 146,
      "category": "dev",
      "type": "blank",
      "question": "Python中，判断变量是否为列表的函数是______。",
      "options": [],
      "answer": "isinstance()"
    },
    {
      "id": "dev-147",
      "sourceId": 147,
      "category": "dev",
      "type": "blank",
      "question": "CSS中，设置边框的属性是______。",
      "options": [],
      "answer": "border"
    },
    {
      "id": "dev-148",
      "sourceId": 148,
      "category": "dev",
      "type": "blank",
      "question": "计算机网络中，DNS的作用是______域名。（两字中文）",
      "options": [],
      "answer": "解析"
    },
    {
      "id": "dev-149",
      "sourceId": 149,
      "category": "dev",
      "type": "blank",
      "question": "Python中，enumerate()函数可以同时获取下标和______。",
      "options": [],
      "answer": "元素"
    },
    {
      "id": "dev-150",
      "sourceId": 150,
      "category": "dev",
      "type": "blank",
      "question": "前端中，LocalStorage的数据存储在______端。",
      "options": [],
      "answer": "浏览"
    }
  ],
  "mind": [
    {
      "id": "mind-1",
      "sourceId": 1,
      "category": "mind",
      "type": "choice",
      "question": "被誉为“心理学之父”的是？",
      "options": [
        {
          "key": "A",
          "text": "弗洛伊德"
        },
        {
          "key": "B",
          "text": "冯特"
        },
        {
          "key": "C",
          "text": "马斯洛"
        },
        {
          "key": "D",
          "text": "皮亚杰"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-2",
      "sourceId": 2,
      "category": "mind",
      "type": "choice",
      "question": "提出“需求层次理论”的心理学家是？",
      "options": [
        {
          "key": "A",
          "text": "罗杰斯"
        },
        {
          "key": "B",
          "text": "马斯洛"
        },
        {
          "key": "C",
          "text": "华生"
        },
        {
          "key": "D",
          "text": "斯金纳"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-3",
      "sourceId": 3,
      "category": "mind",
      "type": "choice",
      "question": "精神分析学派的创始人是？",
      "options": [
        {
          "key": "A",
          "text": "荣格"
        },
        {
          "key": "B",
          "text": "阿德勒"
        },
        {
          "key": "C",
          "text": "弗洛伊德"
        },
        {
          "key": "D",
          "text": "埃里克森"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-4",
      "sourceId": 4,
      "category": "mind",
      "type": "choice",
      "question": "强调“环境决定行为”的心理学流派是？",
      "options": [
        {
          "key": "A",
          "text": "精神分析学派"
        },
        {
          "key": "B",
          "text": "行为主义学派"
        },
        {
          "key": "C",
          "text": "人本主义学派"
        },
        {
          "key": "D",
          "text": "认知心理学派"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-5",
      "sourceId": 5,
      "category": "mind",
      "type": "choice",
      "question": "人本主义心理学的核心主张是？",
      "options": [
        {
          "key": "A",
          "text": "研究潜意识"
        },
        {
          "key": "B",
          "text": "研究可观测行为"
        },
        {
          "key": "C",
          "text": "强调人的自我实现与潜能"
        },
        {
          "key": "D",
          "text": "研究认知思维过程"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-6",
      "sourceId": 6,
      "category": "mind",
      "type": "choice",
      "question": "皮亚杰主要研究的领域是？",
      "options": [
        {
          "key": "A",
          "text": "成人情绪心理"
        },
        {
          "key": "B",
          "text": "儿童认知发展"
        },
        {
          "key": "C",
          "text": "社会交往心理"
        },
        {
          "key": "D",
          "text": "人格障碍心理"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-7",
      "sourceId": 7,
      "category": "mind",
      "type": "choice",
      "question": "人们在群体中容易丧失个体责任感、出现从众行为的现象被称为？",
      "options": [
        {
          "key": "A",
          "text": "刻板效应"
        },
        {
          "key": "B",
          "text": "旁观者效应"
        },
        {
          "key": "C",
          "text": "去个体化"
        },
        {
          "key": "D",
          "text": "晕轮效应"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-8",
      "sourceId": 8,
      "category": "mind",
      "type": "choice",
      "question": "“以偏概全，凭借第一印象判断他人”属于哪种心理效应？",
      "options": [
        {
          "key": "A",
          "text": "近因效应"
        },
        {
          "key": "B",
          "text": "晕轮效应"
        },
        {
          "key": "C",
          "text": "首因效应"
        },
        {
          "key": "D",
          "text": "投射效应"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-9",
      "sourceId": 9,
      "category": "mind",
      "type": "choice",
      "question": "“最近发生的事情对人的判断影响更大”属于？",
      "options": [
        {
          "key": "A",
          "text": "首因效应"
        },
        {
          "key": "B",
          "text": "近因效应"
        },
        {
          "key": "C",
          "text": "刻板效应"
        },
        {
          "key": "D",
          "text": "木桶效应"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-10",
      "sourceId": 10,
      "category": "mind",
      "type": "choice",
      "question": "将自己的想法、情绪投射到他人身上，认为别人和自己一样，属于？",
      "options": [
        {
          "key": "A",
          "text": "投射效应"
        },
        {
          "key": "B",
          "text": "移情效应"
        },
        {
          "key": "C",
          "text": "从众效应"
        },
        {
          "key": "D",
          "text": "光环效应"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-11",
      "sourceId": 11,
      "category": "mind",
      "type": "choice",
      "question": "对某一群体产生固定、片面的固有印象，属于？",
      "options": [
        {
          "key": "A",
          "text": "首因效应"
        },
        {
          "key": "B",
          "text": "刻板效应"
        },
        {
          "key": "C",
          "text": "鲶鱼效应"
        },
        {
          "key": "D",
          "text": "破窗效应"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-12",
      "sourceId": 12,
      "category": "mind",
      "type": "choice",
      "question": "环境中不良现象如果被放任，会诱使人们效仿、变本加厉，这是？",
      "options": [
        {
          "key": "A",
          "text": "破窗效应"
        },
        {
          "key": "B",
          "text": "马太效应"
        },
        {
          "key": "C",
          "text": "蝴蝶效应"
        },
        {
          "key": "D",
          "text": "棘轮效应"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-13",
      "sourceId": 13,
      "category": "mind",
      "type": "choice",
      "question": "强者愈强、弱者愈弱的累积优势现象是？",
      "options": [
        {
          "key": "A",
          "text": "鲶鱼效应"
        },
        {
          "key": "B",
          "text": "马太效应"
        },
        {
          "key": "C",
          "text": "木桶效应"
        },
        {
          "key": "D",
          "text": "边际效应"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-14",
      "sourceId": 14,
      "category": "mind",
      "type": "choice",
      "question": "团队短板决定整体水平的心理与管理效应是？",
      "options": [
        {
          "key": "A",
          "text": "木桶效应"
        },
        {
          "key": "B",
          "text": "破窗效应"
        },
        {
          "key": "C",
          "text": "羊群效应"
        },
        {
          "key": "D",
          "text": "刺猬效应"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-15",
      "sourceId": 15,
      "category": "mind",
      "type": "choice",
      "question": "适度距离才能维持良好人际关系的效应是？",
      "options": [
        {
          "key": "A",
          "text": "刺猬效应"
        },
        {
          "key": "B",
          "text": "距离效应"
        },
        {
          "key": "C",
          "text": "边界效应"
        },
        {
          "key": "D",
          "text": "社交效应"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-16",
      "sourceId": 16,
      "category": "mind",
      "type": "choice",
      "question": "大众盲目跟随多数人行为的现象是？",
      "options": [
        {
          "key": "A",
          "text": "从众效应（羊群效应）"
        },
        {
          "key": "B",
          "text": "旁观者效应"
        },
        {
          "key": "C",
          "text": "习得性无助"
        },
        {
          "key": "D",
          "text": "锚定效应"
        }
      ],
      "answer": "D"
    },
    {
      "id": "mind-17",
      "sourceId": 17,
      "category": "mind",
      "type": "choice",
      "question": "多人在场时，个体帮助他人的意愿会降低的现象是？",
      "options": [
        {
          "key": "A",
          "text": "去个体化"
        },
        {
          "key": "B",
          "text": "旁观者效应"
        },
        {
          "key": "C",
          "text": "责任分散效应"
        },
        {
          "key": "D",
          "text": "以上都是"
        }
      ],
      "answer": "D"
    },
    {
      "id": "mind-18",
      "sourceId": 18,
      "category": "mind",
      "type": "choice",
      "question": "长期经历失败、无法摆脱困境，从而放弃努力的心理状态是？",
      "options": [
        {
          "key": "A",
          "text": "习得性无助"
        },
        {
          "key": "B",
          "text": "焦虑障碍"
        },
        {
          "key": "C",
          "text": "抑郁情绪"
        },
        {
          "key": "D",
          "text": "自我否定"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-19",
      "sourceId": 19,
      "category": "mind",
      "type": "choice",
      "question": "人们判断事物时，容易被第一信息锁定的心理是？",
      "options": [
        {
          "key": "A",
          "text": "锚定效应"
        },
        {
          "key": "B",
          "text": "近因效应"
        },
        {
          "key": "C",
          "text": "晕轮效应"
        },
        {
          "key": "D",
          "text": "投射效应"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-20",
      "sourceId": 20,
      "category": "mind",
      "type": "choice",
      "question": "重复刺激后，人对事物的感受程度逐渐降低的现象是？",
      "options": [
        {
          "key": "A",
          "text": "边际递减效应"
        },
        {
          "key": "B",
          "text": "适应效应"
        },
        {
          "key": "C",
          "text": "脱敏效应"
        },
        {
          "key": "D",
          "text": "疲劳效应"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-21",
      "sourceId": 21,
      "category": "mind",
      "type": "choice",
      "question": "马斯洛需求层次理论的最高层次是？",
      "options": [
        {
          "key": "A",
          "text": "尊重需求"
        },
        {
          "key": "B",
          "text": "安全需求"
        },
        {
          "key": "C",
          "text": "自我实现需求"
        },
        {
          "key": "D",
          "text": "归属需求"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-22",
      "sourceId": 22,
      "category": "mind",
      "type": "choice",
      "question": "马斯洛需求层次的最低层次是？",
      "options": [
        {
          "key": "A",
          "text": "安全需求"
        },
        {
          "key": "B",
          "text": "生理需求"
        },
        {
          "key": "C",
          "text": "归属需求"
        },
        {
          "key": "D",
          "text": "尊重需求"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-23",
      "sourceId": 23,
      "category": "mind",
      "type": "choice",
      "question": "弗洛伊德提出的人格结构中，遵循“快乐原则”的是？",
      "options": [
        {
          "key": "A",
          "text": "本我"
        },
        {
          "key": "B",
          "text": "自我"
        },
        {
          "key": "C",
          "text": "超我"
        },
        {
          "key": "D",
          "text": "真我"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-24",
      "sourceId": 24,
      "category": "mind",
      "type": "choice",
      "question": "弗洛伊德人格结构中，遵循“道德原则”的是？",
      "options": [
        {
          "key": "A",
          "text": "本我"
        },
        {
          "key": "B",
          "text": "自我"
        },
        {
          "key": "C",
          "text": "超我"
        },
        {
          "key": "D",
          "text": "潜意识"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-25",
      "sourceId": 25,
      "category": "mind",
      "type": "choice",
      "question": "弗洛伊德人格结构中，协调现实与欲望、遵循现实原则的是？",
      "options": [
        {
          "key": "A",
          "text": "本我"
        },
        {
          "key": "B",
          "text": "自我"
        },
        {
          "key": "C",
          "text": "超我"
        },
        {
          "key": "D",
          "text": "意识"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-26",
      "sourceId": 26,
      "category": "mind",
      "type": "choice",
      "question": "皮亚杰认知发展阶段中，儿童具备逻辑思维、守恒概念的阶段是？",
      "options": [
        {
          "key": "A",
          "text": "感知运动阶段"
        },
        {
          "key": "B",
          "text": "前运算阶段"
        },
        {
          "key": "C",
          "text": "具体运算阶段"
        },
        {
          "key": "D",
          "text": "形式运算阶段"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-27",
      "sourceId": 27,
      "category": "mind",
      "type": "choice",
      "question": "个体对自我身份、人生目标的认知梳理过程，属于？",
      "options": [
        {
          "key": "A",
          "text": "自我认同"
        },
        {
          "key": "B",
          "text": "自我否定"
        },
        {
          "key": "C",
          "text": "自我接纳"
        },
        {
          "key": "D",
          "text": "自我放纵"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-28",
      "sourceId": 28,
      "category": "mind",
      "type": "choice",
      "question": "面对压力时，个体积极调整心态、应对困境的能力被称为？",
      "options": [
        {
          "key": "A",
          "text": "心理韧性"
        },
        {
          "key": "B",
          "text": "情绪敏感力"
        },
        {
          "key": "C",
          "text": "认知能力"
        },
        {
          "key": "D",
          "text": "抗压阈值"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-29",
      "sourceId": 29,
      "category": "mind",
      "type": "choice",
      "question": "能够识别、接纳、管理自身情绪的能力被称为？",
      "options": [
        {
          "key": "A",
          "text": "智商"
        },
        {
          "key": "B",
          "text": "情商"
        },
        {
          "key": "C",
          "text": "逆商"
        },
        {
          "key": "D",
          "text": "财商"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-30",
      "sourceId": 30,
      "category": "mind",
      "type": "choice",
      "question": "面对挫折、逆境的承受与恢复能力是？",
      "options": [
        {
          "key": "A",
          "text": "情商"
        },
        {
          "key": "B",
          "text": "智商"
        },
        {
          "key": "C",
          "text": "逆商"
        },
        {
          "key": "D",
          "text": "德商"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-31",
      "sourceId": 31,
      "category": "mind",
      "type": "choice",
      "question": "“心态决定行为，行为决定习惯”体现的心理逻辑是？",
      "options": [
        {
          "key": "A",
          "text": "认知影响行为"
        },
        {
          "key": "B",
          "text": "行为决定认知"
        },
        {
          "key": "C",
          "text": "环境决定认知"
        },
        {
          "key": "D",
          "text": "天赋决定行为"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-32",
      "sourceId": 32,
      "category": "mind",
      "type": "choice",
      "question": "过度高估自己能力、盲目自信的心理状态是？",
      "options": [
        {
          "key": "A",
          "text": "自负"
        },
        {
          "key": "B",
          "text": "自卑"
        },
        {
          "key": "C",
          "text": "自恋"
        },
        {
          "key": "D",
          "text": "自省"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-33",
      "sourceId": 33,
      "category": "mind",
      "type": "choice",
      "question": "过度低估自我、否定自身价值的心理状态是？",
      "options": [
        {
          "key": "A",
          "text": "自负"
        },
        {
          "key": "B",
          "text": "自卑"
        },
        {
          "key": "C",
          "text": "自闭"
        },
        {
          "key": "D",
          "text": "消极"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-34",
      "sourceId": 34,
      "category": "mind",
      "type": "choice",
      "question": "将负面情绪压抑在内心、不愿表达的心理行为是？",
      "options": [
        {
          "key": "A",
          "text": "情绪内耗"
        },
        {
          "key": "B",
          "text": "情绪宣泄"
        },
        {
          "key": "C",
          "text": "情绪共情"
        },
        {
          "key": "D",
          "text": "情绪迁移"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-35",
      "sourceId": 35,
      "category": "mind",
      "type": "choice",
      "question": "能够感知、理解他人情绪的能力被称为？",
      "options": [
        {
          "key": "A",
          "text": "共情能力"
        },
        {
          "key": "B",
          "text": "移情能力"
        },
        {
          "key": "C",
          "text": "包容能力"
        },
        {
          "key": "D",
          "text": "感知能力"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-36",
      "sourceId": 36,
      "category": "mind",
      "type": "choice",
      "question": "心理学中，“移情”的核心是？",
      "options": [
        {
          "key": "A",
          "text": "理解他人情绪"
        },
        {
          "key": "B",
          "text": "将自身情感转移到他人/事物上"
        },
        {
          "key": "C",
          "text": "同情弱者"
        },
        {
          "key": "D",
          "text": "自我情绪调节"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-37",
      "sourceId": 37,
      "category": "mind",
      "type": "choice",
      "question": "短期、轻微的紧张担忧情绪属于？",
      "options": [
        {
          "key": "A",
          "text": "焦虑情绪"
        },
        {
          "key": "B",
          "text": "焦虑症"
        },
        {
          "key": "C",
          "text": "抑郁情绪"
        },
        {
          "key": "D",
          "text": "强迫症"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-38",
      "sourceId": 38,
      "category": "mind",
      "type": "choice",
      "question": "反复出现强迫思维、强迫行为的心理障碍是？",
      "options": [
        {
          "key": "A",
          "text": "焦虑症"
        },
        {
          "key": "B",
          "text": "抑郁症"
        },
        {
          "key": "C",
          "text": "强迫症"
        },
        {
          "key": "D",
          "text": "恐惧症"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-39",
      "sourceId": 39,
      "category": "mind",
      "type": "choice",
      "question": "对特定场景、事物产生过度、不合理恐惧的心理是？",
      "options": [
        {
          "key": "A",
          "text": "焦虑症"
        },
        {
          "key": "B",
          "text": "恐惧症"
        },
        {
          "key": "C",
          "text": "强迫症"
        },
        {
          "key": "D",
          "text": "躁郁症"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-40",
      "sourceId": 40,
      "category": "mind",
      "type": "choice",
      "question": "个体在独处时感到舒适、不焦虑的心理状态是？",
      "options": [
        {
          "key": "A",
          "text": "孤独"
        },
        {
          "key": "B",
          "text": "独处能力"
        },
        {
          "key": "C",
          "text": "社交恐惧"
        },
        {
          "key": "D",
          "text": "自我封闭"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-41",
      "sourceId": 41,
      "category": "mind",
      "type": "choice",
      "question": "西方哲学的源头文明是？",
      "options": [
        {
          "key": "A",
          "text": "古希腊哲学"
        },
        {
          "key": "B",
          "text": "古罗马哲学"
        },
        {
          "key": "C",
          "text": "古埃及哲学"
        },
        {
          "key": "D",
          "text": "古巴比伦哲学"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-42",
      "sourceId": 42,
      "category": "mind",
      "type": "choice",
      "question": "被誉为“西方哲学之父”的是？",
      "options": [
        {
          "key": "A",
          "text": "柏拉图"
        },
        {
          "key": "B",
          "text": "苏格拉底"
        },
        {
          "key": "C",
          "text": "亚里士多德"
        },
        {
          "key": "D",
          "text": "泰勒斯"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-43",
      "sourceId": 43,
      "category": "mind",
      "type": "choice",
      "question": "提出“认识你自己”的哲学家是？",
      "options": [
        {
          "key": "A",
          "text": "苏格拉底"
        },
        {
          "key": "B",
          "text": "柏拉图"
        },
        {
          "key": "C",
          "text": "亚里士多德"
        },
        {
          "key": "D",
          "text": "尼采"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-44",
      "sourceId": 44,
      "category": "mind",
      "type": "choice",
      "question": "柏拉图的核心著作是？",
      "options": [
        {
          "key": "A",
          "text": "《理想国》"
        },
        {
          "key": "B",
          "text": "《形而上学》"
        },
        {
          "key": "C",
          "text": "《沉思录》"
        },
        {
          "key": "D",
          "text": "《查拉图斯特拉如是说》"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-45",
      "sourceId": 45,
      "category": "mind",
      "type": "choice",
      "question": "亚里士多德是哪位哲学家的学生？",
      "options": [
        {
          "key": "A",
          "text": "苏格拉底"
        },
        {
          "key": "B",
          "text": "柏拉图"
        },
        {
          "key": "C",
          "text": "毕达哥拉斯"
        },
        {
          "key": "D",
          "text": "赫拉克利特"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-46",
      "sourceId": 46,
      "category": "mind",
      "type": "choice",
      "question": "提出“吾爱吾师，吾更爱真理”的是？",
      "options": [
        {
          "key": "A",
          "text": "苏格拉底"
        },
        {
          "key": "B",
          "text": "柏拉图"
        },
        {
          "key": "C",
          "text": "亚里士多德"
        },
        {
          "key": "D",
          "text": "笛卡尔"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-47",
      "sourceId": 47,
      "category": "mind",
      "type": "choice",
      "question": "提出“我思故我在”的哲学家是？",
      "options": [
        {
          "key": "A",
          "text": "培根"
        },
        {
          "key": "B",
          "text": "笛卡尔"
        },
        {
          "key": "C",
          "text": "卢梭"
        },
        {
          "key": "D",
          "text": "康德"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-48",
      "sourceId": 48,
      "category": "mind",
      "type": "choice",
      "question": "经验主义哲学的核心主张是？",
      "options": [
        {
          "key": "A",
          "text": "理性高于经验"
        },
        {
          "key": "B",
          "text": "知识来源于后天经验感知"
        },
        {
          "key": "C",
          "text": "真理与生俱来"
        },
        {
          "key": "D",
          "text": "意志决定一切"
        }
      ],
      "answer": "D"
    },
    {
      "id": "mind-49",
      "sourceId": 49,
      "category": "mind",
      "type": "choice",
      "question": "理性主义哲学的核心主张是？",
      "options": [
        {
          "key": "A",
          "text": "感官经验是真理来源"
        },
        {
          "key": "B",
          "text": "理性思维是认知核心"
        },
        {
          "key": "C",
          "text": "环境决定认知"
        },
        {
          "key": "D",
          "text": "偶然产生真理"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-50",
      "sourceId": 50,
      "category": "mind",
      "type": "choice",
      "question": "康德哲学的核心研究方向是？",
      "options": [
        {
          "key": "A",
          "text": "自然万物本源"
        },
        {
          "key": "B",
          "text": "人类理性与认知边界"
        },
        {
          "key": "C",
          "text": "社会制度构建"
        },
        {
          "key": "D",
          "text": "生命终极意义"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-51",
      "sourceId": 51,
      "category": "mind",
      "type": "choice",
      "question": "尼采属于哪个哲学流派？",
      "options": [
        {
          "key": "A",
          "text": "古典哲学"
        },
        {
          "key": "B",
          "text": "现代非理性主义哲学"
        },
        {
          "key": "C",
          "text": "经验主义哲学"
        },
        {
          "key": "D",
          "text": "功利主义哲学"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-52",
      "sourceId": 52,
      "category": "mind",
      "type": "choice",
      "question": "提出“上帝已死”的哲学家是？",
      "options": [
        {
          "key": "A",
          "text": "康德"
        },
        {
          "key": "B",
          "text": "黑格尔"
        },
        {
          "key": "C",
          "text": "尼采"
        },
        {
          "key": "D",
          "text": "萨特"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-53",
      "sourceId": 53,
      "category": "mind",
      "type": "choice",
      "question": "存在主义哲学的核心观点是？",
      "options": [
        {
          "key": "A",
          "text": "本质先于存在"
        },
        {
          "key": "B",
          "text": "存在先于本质"
        },
        {
          "key": "C",
          "text": "理性决定存在"
        },
        {
          "key": "D",
          "text": "意志决定本质"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-54",
      "sourceId": 54,
      "category": "mind",
      "type": "choice",
      "question": "萨特的核心哲学主张属于？",
      "options": [
        {
          "key": "A",
          "text": "存在主义"
        },
        {
          "key": "B",
          "text": "唯心主义"
        },
        {
          "key": "C",
          "text": "唯物主义"
        },
        {
          "key": "D",
          "text": "功利主义"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-55",
      "sourceId": 55,
      "category": "mind",
      "type": "choice",
      "question": "主张“功利最大化、最大多数人最大幸福”的流派是？",
      "options": [
        {
          "key": "A",
          "text": "存在主义"
        },
        {
          "key": "B",
          "text": "功利主义"
        },
        {
          "key": "C",
          "text": "唯心主义"
        },
        {
          "key": "D",
          "text": "思辨哲学"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-56",
      "sourceId": 56,
      "category": "mind",
      "type": "choice",
      "question": "黑格尔哲学的核心核心概念是？",
      "options": [
        {
          "key": "A",
          "text": "绝对精神"
        },
        {
          "key": "B",
          "text": "自由意志"
        },
        {
          "key": "C",
          "text": "感官经验"
        },
        {
          "key": "D",
          "text": "虚无主义"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-57",
      "sourceId": 57,
      "category": "mind",
      "type": "choice",
      "question": "唯物主义的核心观点是？",
      "options": [
        {
          "key": "A",
          "text": "意识决定物质"
        },
        {
          "key": "B",
          "text": "物质决定意识"
        },
        {
          "key": "C",
          "text": "物质意识相互独立"
        },
        {
          "key": "D",
          "text": "意志主宰世界"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-58",
      "sourceId": 58,
      "category": "mind",
      "type": "choice",
      "question": "唯心主义的核心观点是？",
      "options": [
        {
          "key": "A",
          "text": "物质第一性"
        },
        {
          "key": "B",
          "text": "意识第一性，物质依赖意识存在"
        },
        {
          "key": "C",
          "text": "物质意识统一"
        },
        {
          "key": "D",
          "text": "自然决定一切"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-59",
      "sourceId": 59,
      "category": "mind",
      "type": "choice",
      "question": "古代朴素唯物主义认为世界本源是？",
      "options": [
        {
          "key": "A",
          "text": "精神意志"
        },
        {
          "key": "B",
          "text": "水、火、气等具体物质"
        },
        {
          "key": "C",
          "text": "绝对理念"
        },
        {
          "key": "D",
          "text": "人类思维"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-60",
      "sourceId": 60,
      "category": "mind",
      "type": "choice",
      "question": "提出“人是万物的尺度”的哲学家是？",
      "options": [
        {
          "key": "A",
          "text": "普罗泰戈拉"
        },
        {
          "key": "B",
          "text": "苏格拉底"
        },
        {
          "key": "C",
          "text": "柏拉图"
        },
        {
          "key": "D",
          "text": "亚里士多德"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-61",
      "sourceId": 61,
      "category": "mind",
      "type": "choice",
      "question": "中国传统哲学中，儒家的核心核心是？",
      "options": [
        {
          "key": "A",
          "text": "无为而治"
        },
        {
          "key": "B",
          "text": "仁、礼、义"
        },
        {
          "key": "C",
          "text": "兼爱非攻"
        },
        {
          "key": "D",
          "text": "法治集权"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-62",
      "sourceId": 62,
      "category": "mind",
      "type": "choice",
      "question": "道家的核心思想是？",
      "options": [
        {
          "key": "A",
          "text": "仁者爱人"
        },
        {
          "key": "B",
          "text": "无为而治、道法自然"
        },
        {
          "key": "C",
          "text": "严刑峻法"
        },
        {
          "key": "D",
          "text": "尚贤节用"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-63",
      "sourceId": 63,
      "category": "mind",
      "type": "choice",
      "question": "墨家的核心主张是？",
      "options": [
        {
          "key": "A",
          "text": "仁爱礼制"
        },
        {
          "key": "B",
          "text": "无为不争"
        },
        {
          "key": "C",
          "text": "兼爱、非攻、尚贤"
        },
        {
          "key": "D",
          "text": "以法治国"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-64",
      "sourceId": 64,
      "category": "mind",
      "type": "choice",
      "question": "法家的核心治国理念是？",
      "options": [
        {
          "key": "A",
          "text": "德治教化"
        },
        {
          "key": "B",
          "text": "无为而治"
        },
        {
          "key": "C",
          "text": "严刑峻法、以法治国"
        },
        {
          "key": "D",
          "text": "兼爱互助"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-65",
      "sourceId": 65,
      "category": "mind",
      "type": "choice",
      "question": "儒家创始人是？",
      "options": [
        {
          "key": "A",
          "text": "老子"
        },
        {
          "key": "B",
          "text": "孔子"
        },
        {
          "key": "C",
          "text": "孟子"
        },
        {
          "key": "D",
          "text": "荀子"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-66",
      "sourceId": 66,
      "category": "mind",
      "type": "choice",
      "question": "道家创始人是？",
      "options": [
        {
          "key": "A",
          "text": "庄子"
        },
        {
          "key": "B",
          "text": "老子"
        },
        {
          "key": "C",
          "text": "列子"
        },
        {
          "key": "D",
          "text": "鬼谷子"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-67",
      "sourceId": 67,
      "category": "mind",
      "type": "choice",
      "question": "“己所不欲，勿施于人”的提出者是？",
      "options": [
        {
          "key": "A",
          "text": "孔子"
        },
        {
          "key": "B",
          "text": "孟子"
        },
        {
          "key": "C",
          "text": "老子"
        },
        {
          "key": "D",
          "text": "荀子"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-68",
      "sourceId": 68,
      "category": "mind",
      "type": "choice",
      "question": "“得道多助，失道寡助”出自哪位思想家？",
      "options": [
        {
          "key": "A",
          "text": "孔子"
        },
        {
          "key": "B",
          "text": "孟子"
        },
        {
          "key": "C",
          "text": "老子"
        },
        {
          "key": "D",
          "text": "韩非子"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-69",
      "sourceId": 69,
      "category": "mind",
      "type": "choice",
      "question": "“上善若水”出自哪部著作？",
      "options": [
        {
          "key": "A",
          "text": "《论语》"
        },
        {
          "key": "B",
          "text": "《道德经》"
        },
        {
          "key": "C",
          "text": "《孟子》"
        },
        {
          "key": "D",
          "text": "《庄子》"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-70",
      "sourceId": 70,
      "category": "mind",
      "type": "choice",
      "question": "“天行健，君子以自强不息”出自？",
      "options": [
        {
          "key": "A",
          "text": "《道德经》"
        },
        {
          "key": "B",
          "text": "《周易》"
        },
        {
          "key": "C",
          "text": "《论语》"
        },
        {
          "key": "D",
          "text": "《大学》"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-71",
      "sourceId": 71,
      "category": "mind",
      "type": "choice",
      "question": "儒家“五常”不包含以下哪个？",
      "options": [
        {
          "key": "A",
          "text": "仁"
        },
        {
          "key": "B",
          "text": "义"
        },
        {
          "key": "C",
          "text": "勇"
        },
        {
          "key": "D",
          "text": "信"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-72",
      "sourceId": 72,
      "category": "mind",
      "type": "choice",
      "question": "“性善论”的提出者是？",
      "options": [
        {
          "key": "A",
          "text": "孔子"
        },
        {
          "key": "B",
          "text": "孟子"
        },
        {
          "key": "C",
          "text": "荀子"
        },
        {
          "key": "D",
          "text": "老子"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-73",
      "sourceId": 73,
      "category": "mind",
      "type": "choice",
      "question": "“性恶论”的提出者是？",
      "options": [
        {
          "key": "A",
          "text": "孟子"
        },
        {
          "key": "B",
          "text": "荀子"
        },
        {
          "key": "C",
          "text": "韩非子"
        },
        {
          "key": "D",
          "text": "墨子"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-74",
      "sourceId": 74,
      "category": "mind",
      "type": "choice",
      "question": "庄子的核心人生态度是？",
      "options": [
        {
          "key": "A",
          "text": "积极入世"
        },
        {
          "key": "B",
          "text": "逍遥自在、顺应自然"
        },
        {
          "key": "C",
          "text": "严苛自律"
        },
        {
          "key": "D",
          "text": "功利进取"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-75",
      "sourceId": 75,
      "category": "mind",
      "type": "choice",
      "question": "“知行合一”的提出者是？",
      "options": [
        {
          "key": "A",
          "text": "朱熹"
        },
        {
          "key": "B",
          "text": "王阳明"
        },
        {
          "key": "C",
          "text": "孔子"
        },
        {
          "key": "D",
          "text": "孟子"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-76",
      "sourceId": 76,
      "category": "mind",
      "type": "choice",
      "question": "程朱理学的核心主张是？",
      "options": [
        {
          "key": "A",
          "text": "心外无物"
        },
        {
          "key": "B",
          "text": "存天理，灭人欲"
        },
        {
          "key": "C",
          "text": "知行合一"
        },
        {
          "key": "D",
          "text": "经世致用"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-77",
      "sourceId": 77,
      "category": "mind",
      "type": "choice",
      "question": "王阳明心学的核心观点是？",
      "options": [
        {
          "key": "A",
          "text": "格物致知"
        },
        {
          "key": "B",
          "text": "心外无物，心即理"
        },
        {
          "key": "C",
          "text": "天道自然"
        },
        {
          "key": "D",
          "text": "学以致用"
        }
      ],
      "answer": "C"
    },
    {
      "id": "mind-78",
      "sourceId": 78,
      "category": "mind",
      "type": "choice",
      "question": "“格物致知”是哪个学派的认知方法？",
      "options": [
        {
          "key": "A",
          "text": "程朱理学"
        },
        {
          "key": "B",
          "text": "阳明心学"
        },
        {
          "key": "C",
          "text": "道家"
        },
        {
          "key": "D",
          "text": "墨家"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-79",
      "sourceId": 79,
      "category": "mind",
      "type": "choice",
      "question": "哲学中，“世界观”指的是？",
      "options": [
        {
          "key": "A",
          "text": "改造世界的方法"
        },
        {
          "key": "B",
          "text": "人们对整个世界的总体看法和根本观点"
        },
        {
          "key": "C",
          "text": "具体的生活准则"
        },
        {
          "key": "D",
          "text": "专业的学术理论"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-80",
      "sourceId": 80,
      "category": "mind",
      "type": "choice",
      "question": "哲学中，“方法论”指的是？",
      "options": [
        {
          "key": "A",
          "text": "观察世界的观点"
        },
        {
          "key": "B",
          "text": "认识和改造世界的根本方法"
        },
        {
          "key": "C",
          "text": "科学实验流程"
        },
        {
          "key": "D",
          "text": "人生奋斗目标"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-81",
      "sourceId": 81,
      "category": "mind",
      "type": "choice",
      "question": "辩证思维的核心是？",
      "options": [
        {
          "key": "A",
          "text": "片面绝对看问题"
        },
        {
          "key": "B",
          "text": "全面、联系、发展地看问题"
        },
        {
          "key": "C",
          "text": "仅凭经验判断"
        },
        {
          "key": "D",
          "text": "仅凭直觉判断"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-82",
      "sourceId": 82,
      "category": "mind",
      "type": "choice",
      "question": "“量变引起质变”属于哪种哲学思维？",
      "options": [
        {
          "key": "A",
          "text": "形而上学"
        },
        {
          "key": "B",
          "text": "辩证法"
        },
        {
          "key": "C",
          "text": "唯心主义"
        },
        {
          "key": "D",
          "text": "经验主义"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-83",
      "sourceId": 83,
      "category": "mind",
      "type": "choice",
      "question": "形而上学的思维特点是？",
      "options": [
        {
          "key": "A",
          "text": "孤立、静止、片面看问题"
        },
        {
          "key": "B",
          "text": "联系、发展、全面看问题"
        },
        {
          "key": "C",
          "text": "注重实践验证"
        },
        {
          "key": "D",
          "text": "依托理性推理"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-84",
      "sourceId": 84,
      "category": "mind",
      "type": "choice",
      "question": "“祸兮福之所倚，福兮祸之所伏”体现的哲学思想是？",
      "options": [
        {
          "key": "A",
          "text": "矛盾对立统一"
        },
        {
          "key": "B",
          "text": "量变质变"
        },
        {
          "key": "C",
          "text": "物质决定意识"
        },
        {
          "key": "D",
          "text": "实践出真知"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-85",
      "sourceId": 85,
      "category": "mind",
      "type": "choice",
      "question": "“实践是检验真理的唯一标准”属于哪种哲学理论？",
      "options": [
        {
          "key": "A",
          "text": "唯心主义哲学"
        },
        {
          "key": "B",
          "text": "辩证唯物主义"
        },
        {
          "key": "C",
          "text": "存在主义"
        },
        {
          "key": "D",
          "text": "功利主义"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-86",
      "sourceId": 86,
      "category": "mind",
      "type": "choice",
      "question": "人生哲学中，“接纳不完美的自己”核心体现的是？",
      "options": [
        {
          "key": "A",
          "text": "自我否定"
        },
        {
          "key": "B",
          "text": "自我包容与和解"
        },
        {
          "key": "C",
          "text": "消极躺平"
        },
        {
          "key": "D",
          "text": "安于现状"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-87",
      "sourceId": 87,
      "category": "mind",
      "type": "choice",
      "question": "“物极必反”体现的哲学规律是？",
      "options": [
        {
          "key": "A",
          "text": "对立统一规律"
        },
        {
          "key": "B",
          "text": "质量互变规律"
        },
        {
          "key": "C",
          "text": "否定之否定规律"
        },
        {
          "key": "D",
          "text": "因果规律"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-88",
      "sourceId": 88,
      "category": "mind",
      "type": "choice",
      "question": "“前车之鉴，后事之师”体现的认知逻辑是？",
      "options": [
        {
          "key": "A",
          "text": "经验迁移、理性反思"
        },
        {
          "key": "B",
          "text": "盲目从众"
        },
        {
          "key": "C",
          "text": "直觉判断"
        },
        {
          "key": "D",
          "text": "宿命论"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-89",
      "sourceId": 89,
      "category": "mind",
      "type": "choice",
      "question": "“尽人事，听天命”体现的人生态度是？",
      "options": [
        {
          "key": "A",
          "text": "消极被动"
        },
        {
          "key": "B",
          "text": "尽力而为、顺应规律"
        },
        {
          "key": "C",
          "text": "宿命妥协"
        },
        {
          "key": "D",
          "text": "功利至上"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-90",
      "sourceId": 90,
      "category": "mind",
      "type": "choice",
      "question": "存在主义强调的核心人生特质是？",
      "options": [
        {
          "key": "A",
          "text": "被动接受命运"
        },
        {
          "key": "B",
          "text": "自由选择、承担责任"
        },
        {
          "key": "C",
          "text": "顺从规则"
        },
        {
          "key": "D",
          "text": "追求功利"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-91",
      "sourceId": 91,
      "category": "mind",
      "type": "choice",
      "question": "“不以物喜，不以己悲”体现的心理与哲学境界是？",
      "options": [
        {
          "key": "A",
          "text": "情绪外放、随性而为"
        },
        {
          "key": "B",
          "text": "内心通透、情绪稳定"
        },
        {
          "key": "C",
          "text": "消极冷漠"
        },
        {
          "key": "D",
          "text": "与世隔绝"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-92",
      "sourceId": 92,
      "category": "mind",
      "type": "choice",
      "question": "“千里之行，始于足下”体现的哲学道理是？",
      "options": [
        {
          "key": "A",
          "text": "量变是质变的前提"
        },
        {
          "key": "B",
          "text": "质变决定量变"
        },
        {
          "key": "C",
          "text": "规律不可改变"
        },
        {
          "key": "D",
          "text": "意识决定行动"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-93",
      "sourceId": 93,
      "category": "mind",
      "type": "choice",
      "question": "“塞翁失马，焉知非福”体现的是？",
      "options": [
        {
          "key": "A",
          "text": "矛盾双方相互转化"
        },
        {
          "key": "B",
          "text": "事物永恒不变"
        },
        {
          "key": "C",
          "text": "命运注定论"
        },
        {
          "key": "D",
          "text": "偶然决定必然"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-94",
      "sourceId": 94,
      "category": "mind",
      "type": "choice",
      "question": "哲学中“否定之否定规律”的核心是？",
      "options": [
        {
          "key": "A",
          "text": "事物循环倒退"
        },
        {
          "key": "B",
          "text": "事物螺旋式上升发展"
        },
        {
          "key": "C",
          "text": "事物一成不变"
        },
        {
          "key": "D",
          "text": "事物随机变化"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-95",
      "sourceId": 95,
      "category": "mind",
      "type": "choice",
      "question": "社会心理学中，“刻板印象”的本质是？",
      "options": [
        {
          "key": "A",
          "text": "精准的群体认知"
        },
        {
          "key": "B",
          "text": "片面固化的群体认知偏差"
        },
        {
          "key": "C",
          "text": "客观的社会总结"
        },
        {
          "key": "D",
          "text": "个性化认知"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-96",
      "sourceId": 96,
      "category": "mind",
      "type": "choice",
      "question": "心理“内耗”的主要成因是？",
      "options": [
        {
          "key": "A",
          "text": "过度思虑、自我纠结"
        },
        {
          "key": "B",
          "text": "体力透支"
        },
        {
          "key": "C",
          "text": "外界压力过大"
        },
        {
          "key": "D",
          "text": "环境恶劣"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-97",
      "sourceId": 97,
      "category": "mind",
      "type": "choice",
      "question": "人本主义哲学与心理学共同强调的是？",
      "options": [
        {
          "key": "A",
          "text": "人的价值与潜能"
        },
        {
          "key": "B",
          "text": "环境决定一切"
        },
        {
          "key": "C",
          "text": "潜意识主导行为"
        },
        {
          "key": "D",
          "text": "功利优先"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-98",
      "sourceId": 98,
      "category": "mind",
      "type": "choice",
      "question": "“当局者迷，旁观者清”体现的认知偏差是？",
      "options": [
        {
          "key": "A",
          "text": "情境认知局限"
        },
        {
          "key": "B",
          "text": "锚定效应"
        },
        {
          "key": "C",
          "text": "晕轮效应"
        },
        {
          "key": "D",
          "text": "投射效应"
        }
      ],
      "answer": "A"
    },
    {
      "id": "mind-99",
      "sourceId": 99,
      "category": "mind",
      "type": "choice",
      "question": "理性情绪理论认为，引发情绪的核心是？",
      "options": [
        {
          "key": "A",
          "text": "事件本身"
        },
        {
          "key": "B",
          "text": "人对事件的认知看法"
        },
        {
          "key": "C",
          "text": "环境因素"
        },
        {
          "key": "D",
          "text": "他人评价"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-100",
      "sourceId": 100,
      "category": "mind",
      "type": "choice",
      "question": "终身成长心态的核心是？",
      "options": [
        {
          "key": "A",
          "text": "固化自我认知、拒绝改变"
        },
        {
          "key": "B",
          "text": "接纳不足、持续学习迭代"
        },
        {
          "key": "C",
          "text": "满足现状、停止进步"
        },
        {
          "key": "D",
          "text": "依赖天赋、忽视努力"
        }
      ],
      "answer": "B"
    },
    {
      "id": "mind-101",
      "sourceId": 101,
      "category": "mind",
      "type": "blank",
      "question": "心理学研究的两大核心对象是心理过程和______。",
      "options": [],
      "answer": "个性心理"
    },
    {
      "id": "mind-102",
      "sourceId": 102,
      "category": "mind",
      "type": "blank",
      "question": "马斯洛需求层次理论中，最基础的需求是______需求。",
      "options": [],
      "answer": "生理"
    },
    {
      "id": "mind-103",
      "sourceId": 103,
      "category": "mind",
      "type": "blank",
      "question": "弗洛伊德人格三结构分别是本我、自我、______。",
      "options": [],
      "answer": "超我"
    },
    {
      "id": "mind-104",
      "sourceId": 104,
      "category": "mind",
      "type": "blank",
      "question": "多人在场时个体责任感降低的现象，叫做______效应。",
      "options": [],
      "answer": "责任分散"
    },
    {
      "id": "mind-105",
      "sourceId": 105,
      "category": "mind",
      "type": "blank",
      "question": "凭借第一印象判定他人的心理效应是______效应。",
      "options": [],
      "answer": "首因"
    },
    {
      "id": "mind-106",
      "sourceId": 106,
      "category": "mind",
      "type": "blank",
      "question": "最近发生的事件对判断影响更大的效应是______效应。",
      "options": [],
      "answer": "近因"
    },
    {
      "id": "mind-107",
      "sourceId": 107,
      "category": "mind",
      "type": "blank",
      "question": "强者愈强、弱者愈弱的现象被称为______效应。",
      "options": [],
      "answer": "马太"
    },
    {
      "id": "mind-108",
      "sourceId": 108,
      "category": "mind",
      "type": "blank",
      "question": "放任小的不良问题会引发更大问题的是______效应。",
      "options": [],
      "answer": "破窗"
    },
    {
      "id": "mind-109",
      "sourceId": 109,
      "category": "mind",
      "type": "blank",
      "question": "长期失败后放弃努力的心理状态是______无助。",
      "options": [],
      "answer": "习得性"
    },
    {
      "id": "mind-110",
      "sourceId": 110,
      "category": "mind",
      "type": "blank",
      "question": "感知、理解、体谅他人情绪的能力叫做______。",
      "options": [],
      "answer": "共情"
    },
    {
      "id": "mind-111",
      "sourceId": 111,
      "category": "mind",
      "type": "blank",
      "question": "调节、管理自身情绪的能力简称______。",
      "options": [],
      "answer": "情商"
    },
    {
      "id": "mind-112",
      "sourceId": 112,
      "category": "mind",
      "type": "blank",
      "question": "面对挫折逆境的抗压与恢复能力是______。",
      "options": [],
      "answer": "逆商"
    },
    {
      "id": "mind-113",
      "sourceId": 113,
      "category": "mind",
      "type": "blank",
      "question": "重复刺激后感受逐渐减弱的现象是边际______效应。",
      "options": [],
      "answer": "递减"
    },
    {
      "id": "mind-114",
      "sourceId": 114,
      "category": "mind",
      "type": "blank",
      "question": "适度距离维系良好人际关系的是______效应。",
      "options": [],
      "answer": "刺猬"
    },
    {
      "id": "mind-115",
      "sourceId": 115,
      "category": "mind",
      "type": "blank",
      "question": "盲目跟随多数人行为的心理俗称______效应。",
      "options": [],
      "answer": "羊群"
    },
    {
      "id": "mind-116",
      "sourceId": 116,
      "category": "mind",
      "type": "blank",
      "question": "将自身情绪想法强加给他人的心理是______效应。",
      "options": [],
      "answer": "投射"
    },
    {
      "id": "mind-117",
      "sourceId": 117,
      "category": "mind",
      "type": "blank",
      "question": "对群体产生固定片面印象的心理是______效应。",
      "options": [],
      "answer": "刻板"
    },
    {
      "id": "mind-118",
      "sourceId": 118,
      "category": "mind",
      "type": "blank",
      "question": "儿童认知发展理论的提出者是______。",
      "options": [],
      "answer": "皮亚杰"
    },
    {
      "id": "mind-119",
      "sourceId": 119,
      "category": "mind",
      "type": "blank",
      "question": "心理学之父是德国学者______。",
      "options": [],
      "answer": "冯特"
    },
    {
      "id": "mind-120",
      "sourceId": 120,
      "category": "mind",
      "type": "blank",
      "question": "精神分析学派创始人是______。",
      "options": [],
      "answer": "弗洛伊德"
    },
    {
      "id": "mind-121",
      "sourceId": 121,
      "category": "mind",
      "type": "blank",
      "question": "西方哲学源头是______哲学。",
      "options": [],
      "answer": "古希腊"
    },
    {
      "id": "mind-122",
      "sourceId": 122,
      "category": "mind",
      "type": "blank",
      "question": "提出“认识你自己”的古希腊哲学家是______。",
      "options": [],
      "answer": "苏格拉底"
    },
    {
      "id": "mind-123",
      "sourceId": 123,
      "category": "mind",
      "type": "blank",
      "question": "“我思故我在”的提出者是______。",
      "options": [],
      "answer": "笛卡尔"
    },
    {
      "id": "mind-124",
      "sourceId": 124,
      "category": "mind",
      "type": "blank",
      "question": "提出“上帝已死”的哲学家是______。",
      "options": [],
      "answer": "尼采"
    },
    {
      "id": "mind-125",
      "sourceId": 125,
      "category": "mind",
      "type": "blank",
      "question": "存在主义核心观点是存在______本质。",
      "options": [],
      "answer": "先于"
    },
    {
      "id": "mind-126",
      "sourceId": 126,
      "category": "mind",
      "type": "blank",
      "question": "物质决定意识是______主义的核心观点。",
      "options": [],
      "answer": "唯物"
    },
    {
      "id": "mind-127",
      "sourceId": 127,
      "category": "mind",
      "type": "blank",
      "question": "意识决定物质是______主义的核心观点。",
      "options": [],
      "answer": "唯心"
    },
    {
      "id": "mind-128",
      "sourceId": 128,
      "category": "mind",
      "type": "blank",
      "question": "吾爱吾师，吾更爱真理的提出者是______。",
      "options": [],
      "answer": "亚里士多德"
    },
    {
      "id": "mind-129",
      "sourceId": 129,
      "category": "mind",
      "type": "blank",
      "question": "柏拉图的经典著作是《______》。",
      "options": [],
      "answer": "理想国"
    },
    {
      "id": "mind-130",
      "sourceId": 130,
      "category": "mind",
      "type": "blank",
      "question": "黑格尔哲学的核心概念是______精神。",
      "options": [],
      "answer": "绝对"
    },
    {
      "id": "mind-131",
      "sourceId": 131,
      "category": "mind",
      "type": "blank",
      "question": "中国儒家创始人是______。",
      "options": [],
      "answer": "孔子"
    },
    {
      "id": "mind-132",
      "sourceId": 132,
      "category": "mind",
      "type": "blank",
      "question": "中国道家创始人是______。",
      "options": [],
      "answer": "老子"
    },
    {
      "id": "mind-133",
      "sourceId": 133,
      "category": "mind",
      "type": "blank",
      "question": "“己所不欲，勿施于人”是______的核心思想。",
      "options": [],
      "answer": "孔子"
    },
    {
      "id": "mind-134",
      "sourceId": 134,
      "category": "mind",
      "type": "blank",
      "question": "“上善若水”出自《______》。",
      "options": [],
      "answer": "道德经"
    },
    {
      "id": "mind-135",
      "sourceId": 135,
      "category": "mind",
      "type": "blank",
      "question": "性善论的提出者是______。",
      "options": [],
      "answer": "孟子"
    },
    {
      "id": "mind-136",
      "sourceId": 136,
      "category": "mind",
      "type": "blank",
      "question": "性恶论的提出者是______。",
      "options": [],
      "answer": "荀子"
    },
    {
      "id": "mind-137",
      "sourceId": 137,
      "category": "mind",
      "type": "blank",
      "question": "知行合一思想的提出者是______。",
      "options": [],
      "answer": "王阳明"
    },
    {
      "id": "mind-138",
      "sourceId": 138,
      "category": "mind",
      "type": "blank",
      "question": "道家核心思想是道法自然、______而治。",
      "options": [],
      "answer": "无为"
    },
    {
      "id": "mind-139",
      "sourceId": 139,
      "category": "mind",
      "type": "blank",
      "question": "墨家核心主张是兼爱、______。",
      "options": [],
      "answer": "非攻"
    },
    {
      "id": "mind-140",
      "sourceId": 140,
      "category": "mind",
      "type": "blank",
      "question": "法家主张以______治国。",
      "options": [],
      "answer": "法"
    },
    {
      "id": "mind-141",
      "sourceId": 141,
      "category": "mind",
      "type": "blank",
      "question": "量变积累到一定程度会引发______。",
      "options": [],
      "answer": "质变"
    },
    {
      "id": "mind-142",
      "sourceId": 142,
      "category": "mind",
      "type": "blank",
      "question": "矛盾双方相互依存、相互转化体现对立______规律。",
      "options": [],
      "answer": "统一"
    },
    {
      "id": "mind-143",
      "sourceId": 143,
      "category": "mind",
      "type": "blank",
      "question": "事物发展的根本规律是否定之______规律。",
      "options": [],
      "answer": "否定"
    },
    {
      "id": "mind-144",
      "sourceId": 144,
      "category": "mind",
      "type": "blank",
      "question": "实践是______真理的唯一标准。",
      "options": [],
      "answer": "检验"
    },
    {
      "id": "mind-145",
      "sourceId": 145,
      "category": "mind",
      "type": "blank",
      "question": "全面联系发展看问题的思维是______思维。",
      "options": [],
      "answer": "辩证"
    },
    {
      "id": "mind-146",
      "sourceId": 146,
      "category": "mind",
      "type": "blank",
      "question": "孤立静止片面看问题的思维是______思维。",
      "options": [],
      "answer": "形而上学"
    },
    {
      "id": "mind-147",
      "sourceId": 147,
      "category": "mind",
      "type": "blank",
      "question": "心态纠结、过度思虑消耗精力的心理状态是情绪______。",
      "options": [],
      "answer": "内耗"
    },
    {
      "id": "mind-148",
      "sourceId": 148,
      "category": "mind",
      "type": "blank",
      "question": "接纳自我、持续成长的心态叫做______心态。",
      "options": [],
      "answer": "成长型"
    },
    {
      "id": "mind-149",
      "sourceId": 149,
      "category": "mind",
      "type": "blank",
      "question": "人们对世界的根本看法和观点是______。",
      "options": [],
      "answer": "世界观"
    },
    {
      "id": "mind-150",
      "sourceId": 150,
      "category": "mind",
      "type": "blank",
      "question": "认识改造世界的根本方法是______。",
      "options": [],
      "answer": "方法论"
    }
  ]
};

module.exports = { EXAM_BANKS };
