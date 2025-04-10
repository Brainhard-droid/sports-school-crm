import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-2xl">Политика конфиденциальности</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-xl font-bold">1. Общие положения</h2>
              <p>
                1.1. Настоящая Политика конфиденциальности (далее — «Политика») разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных физических лиц (далее — «Субъекты персональных данных»), устанавливает правила использования персональных данных, а также права и обязанности Оператора и Субъекта персональных данных.
              </p>
              <p>
                1.2. Целью настоящей Политики является обеспечение надлежащей защиты информации о физических лицах, в том числе их персональных данных, от несанкционированного доступа и разглашения.
              </p>
              <p>
                1.3. Отношения, связанные со сбором, хранением, распространением и защитой информации о пользователях, регулируются настоящей Политикой и действующим законодательством Российской Федерации.
              </p>
              <p>
                1.4. Действующая редакция Политики, являющейся публичным документом, доступна любому пользователю сети Интернет. Оператор вправе вносить изменения в настоящую Политику. При внесении изменений Оператор уведомляет об этом пользователей путем размещения новой редакции Политики на сайте.
              </p>

              <h2 className="text-xl font-bold">2. Основные понятия</h2>
              <p>
                2.1. В настоящей Политике используются следующие основные понятия:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определенному или определяемому физическому лицу (субъекту персональных данных);
                </li>
                <li>
                  <strong>Оператор персональных данных</strong> — спортивная школа, осуществляющая обработку персональных данных;
                </li>
                <li>
                  <strong>Обработка персональных данных</strong> — любое действие (операция) или совокупность действий (операций), совершаемых с использованием средств автоматизации или без использования таких средств с персональными данными;
                </li>
                <li>
                  <strong>Субъект персональных данных</strong> — физическое лицо, которое прямо или косвенно определено или определяемо с помощью персональных данных;
                </li>
                <li>
                  <strong>Сайт</strong> — интернет-ресурс, принадлежащий Оператору, расположенный в сети Интернет.
                </li>
              </ul>

              <h2 className="text-xl font-bold">3. Состав обрабатываемых персональных данных</h2>
              <p>
                3.1. Оператор обрабатывает следующие категории персональных данных:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>фамилия, имя, отчество ребенка;</li>
                <li>возраст ребенка;</li>
                <li>фамилия, имя, отчество родителя или законного представителя;</li>
                <li>контактный телефон родителя или законного представителя;</li>
                <li>информация о выбранной спортивной секции;</li>
                <li>информация о выбранном филиале (отделении);</li>
                <li>информация о желаемой дате занятий.</li>
              </ul>
              <p>
                3.2. Оператор получает персональные данные непосредственно от Субъектов персональных данных или их законных представителей через формы, размещенные на Сайте.
              </p>

              <h2 className="text-xl font-bold">4. Цели обработки персональных данных</h2>
              <p>
                4.1. Оператор осуществляет обработку персональных данных в следующих целях:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>организация и проведение пробных занятий;</li>
                <li>запись детей в спортивные секции;</li>
                <li>коммуникация с родителями или законными представителями детей;</li>
                <li>информирование о расписании занятий и любых его изменениях;</li>
                <li>улучшение качества предоставляемых услуг;</li>
                <li>выполнение требований российского законодательства.</li>
              </ul>

              <h2 className="text-xl font-bold">5. Правовые основания обработки персональных данных</h2>
              <p>
                Оператор обрабатывает персональные данные Субъекта персональных данных только в случае их заполнения и/или отправки Субъектом персональных данных самостоятельно через форму, расположенную на Сайте. Заполняя соответствующую форму и/или отправляя свои персональные данные Оператору, Субъект персональных данных выражает свое согласие с настоящей Политикой.
              </p>

              <h2 className="text-xl font-bold">6. Порядок и условия обработки персональных данных</h2>
              <p>
                6.1. Обработка персональных данных осуществляется с согласия Субъекта персональных данных на обработку его персональных данных.
              </p>
              <p>
                6.2. Обработка персональных данных Субъектов включает в себя следующие действия: сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передачу (распространение, предоставление, доступ), обезличивание, блокирование, удаление, уничтожение персональных данных.
              </p>
              <p>
                6.3. Оператор принимает необходимые организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа к ним, уничтожения, изменения, блокирования, копирования, предоставления, распространения персональных данных, а также от иных неправомерных действий в отношении персональных данных.
              </p>
              <p>
                6.4. Оператор не осуществляет трансграничную передачу персональных данных.
              </p>

              <h2 className="text-xl font-bold">7. Особенности обработки персональных данных несовершеннолетних</h2>
              <p>
                7.1. Обработка персональных данных несовершеннолетних осуществляется с письменного согласия их законных представителей (родителей, усыновителей, опекунов).
              </p>
              <p>
                7.2. Родитель или законный представитель подтверждает, что действует в интересах несовершеннолетнего и имеет все необходимые полномочия на предоставление персональных данных и дачу согласия на их обработку.
              </p>

              <h2 className="text-xl font-bold">8. Права субъектов персональных данных</h2>
              <p>
                8.1. Субъект персональных данных имеет право:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>получить подтверждение факта обработки его персональных данных;</li>
                <li>ознакомиться с обрабатываемыми персональными данными;</li>
                <li>требовать уточнения, блокирования или уничтожения персональных данных в случае, если они являются неполными, устаревшими, неточными, незаконно полученными или не являются необходимыми для заявленной цели обработки;</li>
                <li>отозвать свое согласие на обработку персональных данных;</li>
                <li>обжаловать действия или бездействие Оператора в уполномоченный орган по защите прав субъектов персональных данных или в судебном порядке.</li>
              </ul>
              <p>
                8.2. Для реализации своих прав Субъект персональных данных может направить соответствующий запрос или обращение по адресу электронной почты или почтовому адресу Оператора, указанным на Сайте.
              </p>

              <h2 className="text-xl font-bold">9. Срок обработки персональных данных</h2>
              <p>
                9.1. Персональные данные обрабатываются до достижения целей обработки, указанных в настоящей Политике, если иное не предусмотрено законодательством Российской Федерации.
              </p>
              <p>
                9.2. Субъект персональных данных может в любой момент отозвать свое согласие на обработку персональных данных, направив соответствующее уведомление Оператору.
              </p>
              <p>
                9.3. В случае отзыва Субъектом персональных данных согласия на обработку персональных данных Оператор прекращает обработку персональных данных и уничтожает их, если иное не предусмотрено законодательством Российской Федерации.
              </p>

              <h2 className="text-xl font-bold">10. Заключительные положения</h2>
              <p>
                10.1. Настоящая Политика вступает в силу с момента ее размещения на Сайте.
              </p>
              <p>
                10.2. По всем вопросам, связанным с настоящей Политикой, пользователи могут обращаться к Оператору.
              </p>
              <p>
                10.3. Пользователь подтверждает, что ознакомлен со всеми пунктами настоящей Политики конфиденциальности и безоговорочно принимает их.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}