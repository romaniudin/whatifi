from datetime import date
from dateutil import relativedelta

### Variables

### Biographical Information Variables

name = ""
gender = ""
birth_date = ""
relationship = ""
disability = True

### Income Variables

income_type = ""

# pay frequency is either weekly (w), bi-weekly (bw), monthly (m) or salary (s)

pay_freq = "w"
pay_gross = 1000

### Working Variables 

work_start = ""
work_end = ""

c_first_name = "Jim"
c_birth_year = 2018
c_birth_month = 2
c_disability = False

### Childcare Variables

cc_start_date = date(c_birth_year, c_birth_month+7, 1)
cc_rate = 35

### Calculations

"""
    Determines tax credit eligibility, dependent on whether or not 
    a parent has a disability
"""

def TaxCreditEligibility(disability):
    if disability == True:
        return True
    else:
        return False

"""
    Calculates monthly gross pay
"""
    
def MonthlyGross(pay_freq, pay_gross):
    if pay_freq == "w":
        return pay_gross*52/12
    if pay_freq == "bw":
        return pay_gross*26/12
    if pay_freq == "m":
        return pay_gross
    if pay_freq == "s":
        return pay_gross/12

"""
    Creates datetime object containing childs birth date
"""

def cBirthDate(c_birth_year, c_birth_month):
    return date(c_birth_year, c_birth_month, 15)

"""
    Creates datetime object containing when child will be five 
    years old
"""    

def cAgeFive(c_birth_year, c_birth_month):
    return date(c_birth_year+5, c_birth_month, 15)
    
"""
    Creates datetime object containing when child will be starting
    kindergarten. Set to the september 1st in the year the child is 5.
"""
    
def cStartKinder(c_birth_year, c_birth_month):
    return date(c_birth_year+5, 9, 1)

"""
    Age at which child starts childcare. Difference between 
"""

def ccStartAge(c_birth_year, c_birth_month, cc_start_date):
    delta = relativedelta.relativedelta(cc_start_date, cBirthDate(c_birth_year, c_birth_month))
    return delta.months

"""
    Total number of days child is in childcare. Difference between kindergarten
    start date and childcare start date in days, then multiplied by 5/7
"""

def ccTotalDays(c_birth_year, c_birth_month, cc_start_date):
    delta = cStartKinder(c_birth_year, c_birth_month) - cc_start_date
    return delta.days*5/7

"""
    Total pre-tax childcare rate
"""

def ccPreTxCCCost(cc_rate, c_birth_year, c_birth_month, cc_start_date):
    return cc_rate*ccTotalDays(c_birth_year, c_birth_month, cc_start_date)

"""
    Calculates monthly BC tax
"""

def BCTax(MonthlyGross):
    b1_from = 0
    b1_to = 38897/12
    b2_from = 38898/12
    b2_to = 77796/12
    b3_from = 77797/12
    b3_to = 89319/12
    b4_from = 89320/12
    b4_to = 108459/12
    b5_from = 108460/12
    
    b1_rate = 5.06
    b2_rate = 7.7
    b3_rate = 10.5
    b4_rate = 12.29
    b5_rate = 14.7
    
    if MonthlyGross > b1_from and MonthlyGross < b1_to:
        tax = MonthlyGross*b1_rate/100
        
    if MonthlyGross > b2_from and MonthlyGross < b2_to:
        b1_tax = (b1_to-b1_from)*b1_rate/100
        b2_tax = (MonthlyGross - b2_from)*b2_rate/100
        tax = b1_tax + b2_tax
    
    if MonthlyGross > b3_from and MonthlyGross < b3_to:
        b1_tax = (b1_to-b1_from)*b1_rate/100
        b2_tax = (b2_to-b2_from)*b2_rate/100
        b3_tax = (MonthlyGross - b3_from)*b3_rate/100
        tax = b1_tax + b2_tax + b3_tax
        
    if MonthlyGross > b4_from and MonthlyGross < b4_to:
        b1_tax = (b1_to-b1_from)*b1_rate/100
        b2_tax = (b2_to-b2_from)*b2_rate/100
        b3_tax = (b3_to-b3_from)*b3_rate/100
        b4_tax = (MonthlyGross - b4_from)*b4_rate/100
        tax = b1_tax + b2_tax + b3_tax + b4_tax
        
    if MonthlyGross > b5_from:
        b1_tax = (b1_to-b1_from)*b1_rate/100
        b2_tax = (b2_to-b2_from)*b2_rate/100
        b3_tax = (b3_to-b3_from)*b3_rate/100
        b4_tax = (b4_to-b4_from)*b4_rate/100
        b5_tax = (MonthlyGross - b5_from)*b5_rate/100
        tax = b1_tax + b2_tax + b3_tax + b4_tax + b5_tax
    
    return tax
  
"""
    Calculates monthly Federal tax
"""
    
def FedTax(MonthlyGross):
    b1_from = 0
    b1_to = 45915/12
    b2_from = 45916/12
    b2_to = 91830/12
    b3_from = 91831/12
    b3_to = 142352/12
    b4_from = 142353/12
    b4_to = 202799/12
    b5_from = 202800/12
    
    b1_rate = 15.0
    b2_rate = 20.5
    b3_rate = 26.0
    b4_rate = 29.0
    b5_rate = 33.0
    
    if MonthlyGross > b1_from and MonthlyGross < b1_to:
        tax = MonthlyGross*b1_rate/100
        
    if MonthlyGross > b2_from and MonthlyGross < b2_to:
        b1_tax = (b1_to-b1_from)*b1_rate/100
        b2_tax = (MonthlyGross - b2_from)*b2_rate/100
        tax = b1_tax + b2_tax
    
    if MonthlyGross > b3_from and MonthlyGross < b3_to:
        b1_tax = (b1_to-b1_from)*b1_rate/100
        b2_tax = (b2_to-b2_from)*b2_rate/100
        b3_tax = (MonthlyGross - b3_from)*b3_rate/100
        tax = b1_tax + b2_tax + b3_tax
        
    if MonthlyGross > b4_from and MonthlyGross < b4_to:
        b1_tax = (b1_to-b1_from)*b1_rate/100
        b2_tax = (b2_to-b2_from)*b2_rate/100
        b3_tax = (b3_to-b3_from)*b3_rate/100
        b4_tax = (MonthlyGross - b4_from)*b4_rate/100
        tax = b1_tax + b2_tax + b3_tax + b4_tax
        
    if MonthlyGross > b5_from:
        b1_tax = (b1_to-b1_from)*b1_rate/100
        b2_tax = (b2_to-b2_from)*b2_rate/100
        b3_tax = (b3_to-b3_from)*b3_rate/100
        b4_tax = (b4_to-b4_from)*b4_rate/100
        b5_tax = (MonthlyGross - b5_from)*b5_rate/100
        tax = b1_tax + b2_tax + b3_tax + b4_tax + b5_tax
    
    return tax

### Test for a simple example

### Biographical Information Variables

name = ""
gender = ""
birth_date = ""
relationship = ""
disability = False

### Income Variables

income_type = ""

# pay frequency is either weekly (w), bi-weekly (bw), monthly (m) or salary (s)

pay_freq = "w"
pay_gross = 1000

### Working Variables 

work_start = ""
work_end = ""

c_first_name = "Jim"
c_birth_year = 2018
c_birth_month = 2
c_disability = False

### Childcare Variables

cc_start_date = date(c_birth_year, c_birth_month+7, 1)
cc_rate = 35

# Calculate gross monthly salary

gross_month = MonthlyGross(pay_freq, pay_gross)

# Calculate BC monthly tax 

tax_bc = BCTax(gross_month)

# Calculate Federal monthly tax 

tax_fed = FedTax(gross_month)

# Calculate net monthly salary 

net_month = gross_month - tax_bc - tax_fed

# Calculate the total number of childcare days required

cc_days = ccTotalDays(c_birth_year, c_birth_month, cc_start_date)

# Calculate the monthly cost of childcare 

cc_cost = ccPreTxCCCost(cc_rate, c_birth_year, c_birth_month, cc_start_date)*20/cc_days

# Calculate salary after tax and childcare costs are deducted

sal_take_home = net_month - cc_cost

print("Gross monthly income: %f" %gross_month)
print("\nNet monthly income: %f"%net_month)
print("\nTotal number of days of childcare required: %f" %cc_days)
print("\nTotal cost of childcare: %f" %cc_cost)
print("\nTake home pay after childcare and tax deducted: %f" %sal_take_home)