import matplotlib.pyplot as plt

def data_formula(x):
    return 1399.46 + 30.58 * x
def data_formula2(x):
    return 1674.39 + 30.9 * x



data = list(map(data_formula, range(1, 31)))
data2 = list(map(data_formula2, range(1, 31)))
plt.xlabel('numarul de aprobatori')
plt.ylabel('10^14 WEI')
plt.title('Costul de creare al contractului')
plt.plot(range(1, 31), data, label='wallet cu semnatura multipla')
plt.plot(range(1, 31), data2, label='Zero knowledge proof')
plt.legend()
plt.show()

def data_formula3(x):
  return 216.405 + 72.154 * x - 72.154 + 107.769
def data_formula4(x):
  return 78.388 + x*18.424

data = list(map(data_formula3, range(1, 101)))
data2 = list(map(data_formula4, range(1, 101)))
plt.xlabel('Numarul de aprobatori')
plt.ylabel('10^13 WEI')
plt.title('Costul de transfer din contract')
plt.plot(range(1, 101), data, label='wallet cu semnatura multipla')
plt.plot(range(1, 101), data2, label='Zero knowledge proof')
plt.legend()
plt.show()

money1 = data_formula3(5)
money2 = data_formula4(5)
data = list(map(lambda x : x * money1, range(1, 1001)))
data2 = list(map(lambda x : x * money2, range(1, 1001)))
plt.xlabel('numarul de tranzactii')
plt.ylabel('10^13 WEI')
plt.title('Costul tranzactiilor in timp')
plt.plot(range(1, 1001), data, label='wallet cu semnatura multipla')
plt.plot(range(1, 1001), data2, label='Zero knowledge proof')
plt.legend()
plt.show()