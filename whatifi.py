#!/usr/local/bin/python3

class income():

    def __init__(self):
        self.value = 0
        self.date_start = 0
        self.date_end = -1

    def value_for_date(self,date):
        if date >= self.date_start:
            if date <= self.date_end or self.date_end == -1:
                return self.value

        return 0

    def total_value(self,start,end):
        tv = 0
        for i in range(start,end):
            tv += self.value_for_date(i)

        return tv

class person():

    def __init__(self):
        self.values = []

    def total_value(self,start,end):
        tv = 0
        for value in self.values:
            tv += value.total_value(start,end)

        return tv

class scenario():

    def __init__(self):
        self.scenarios = []
        self.is_selected = False
        self.total_value = 0


    def


def main():
    you = person()

    yi1 = income()
    yi1.value = 10
    yi1.date_start = 2

    you.values.append(yi1)

    tax_return = income()
    tax_return.value = 100
    tax_return.date_end = 0
    you.values.append(tax_return)

    partner = person()

    pi1 = income()
    pi1.value = 20
    pi1.date_start = 1

    partner.values.append(yi1)
    print("partner: %i" % partner.total_value(0,10))
    you.values.append(partner)

    ch1 = person()
    ci1 = income()
    ci1.value = -5
    ci1.date_start = 0
    ch1.values.append(ci1)

    ch2 = person()
    ci2 = income()
    ci2.value = -10
    ci2.date_start = 0
    ch2.values.append(ci2)

    you.values.append(ch1)
    you.values.append(ch2)

    print("you: %i" % you.total_value(0,10))

if __name__ == "__main__":
    main()
